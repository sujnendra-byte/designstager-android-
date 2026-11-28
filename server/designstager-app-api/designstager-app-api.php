<?php
/**
 * Plugin Name: DesignStager App API
 * Description: Secure login and clean JSON endpoints for the DesignStager iOS / Android app. Works next to the main DesignStager plugin.
 * Version:     1.0.0
 * Author:      DesignStager
 * Requires PHP: 7.4
 *
 * What it adds (all under /wp-json/ds-app/v1/):
 *   POST login            username/email + password  -> app token (the password is never stored)
 *   POST logout           ends this phone's session
 *   GET  me               name, email, avatar, credits, plan, download limits
 *   GET  images           the user's AI images as JSON (the site's own list returns web HTML)
 *   GET  market           marketplace items (search, category, free/pro) as JSON
 *   GET  market/categories
 *   POST market/download  same daily limits as the website, then the file link
 *   POST web-code         one-time code so a web page opened inside the app is already logged in
 *   GET  web              uses that code: logs the in-app browser in and opens the page
 *
 * The token also works on the site's existing routes (/wp-json/ds/v1/...), e.g. credits, my-ppts,
 * my-audio, my-videos, load-ppt — the app sends it in the "X-DS-App-Token" header
 * (some hosts drop the normal "Authorization" header, so both are accepted).
 *
 * No buying happens through this plugin: it has no payment routes.
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'DSAPP_TOKEN_DAYS', 90 );
define( 'DSAPP_MAX_DEVICES', 10 );

/* ------------------------------------------------------------------ tokens */

function dsapp_hash( $token ) { return hash( 'sha256', (string) $token ); }

/** Create a token for a user; only its hash is stored. */
function dsapp_issue_token( $uid, $device ) {
	$token  = 'dsa_' . bin2hex( random_bytes( 32 ) );
	$tokens = get_user_meta( $uid, 'dsapp_tokens', true );
	if ( ! is_array( $tokens ) ) $tokens = array();
	$now = time();
	foreach ( $tokens as $h => $t ) {                       // drop expired ones
		if ( empty( $t['exp'] ) || $t['exp'] < $now ) unset( $tokens[ $h ] );
	}
	if ( count( $tokens ) >= DSAPP_MAX_DEVICES ) {            // keep the newest devices
		uasort( $tokens, function ( $a, $b ) { return ( $a['used'] ?? 0 ) <=> ( $b['used'] ?? 0 ); } );
		$tokens = array_slice( $tokens, -( DSAPP_MAX_DEVICES - 1 ), null, true );
	}
	$tokens[ dsapp_hash( $token ) ] = array(
		'device'  => substr( sanitize_text_field( $device ), 0, 60 ),
		'created' => $now,
		'used'    => $now,
		'exp'     => $now + DSAPP_TOKEN_DAYS * DAY_IN_SECONDS,
	);
	update_user_meta( $uid, 'dsapp_tokens', $tokens );
	dsapp_sync_index( $uid, $tokens );
	return $token;
}

/** One searchable row per live token hash (exact lookups instead of text search). */
function dsapp_sync_index( $uid, $tokens ) {
	delete_user_meta( $uid, 'dsapp_tokhash' );
	foreach ( array_keys( (array) $tokens ) as $h ) add_user_meta( $uid, 'dsapp_tokhash', $h );
}

/** The token sent with this request, if any. */
function dsapp_request_token() {
	$t = '';
	if ( ! empty( $_SERVER['HTTP_X_DS_APP_TOKEN'] ) ) {
		$t = $_SERVER['HTTP_X_DS_APP_TOKEN'];
	} else {
		$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? ( $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '' );
		if ( stripos( $auth, 'Bearer ' ) === 0 ) $t = substr( $auth, 7 );
	}
	$t = trim( (string) $t );
	return preg_match( '/^dsa_[a-f0-9]{64}$/', $t ) ? $t : '';
}

/** Find the user a token belongs to (and refresh its "last used" time at most once an hour). */
function dsapp_user_for_token( $token ) {
	if ( ! $token ) return 0;
	$h     = dsapp_hash( $token );
	$users = get_users( array(
		'meta_key'   => 'dsapp_tokhash',
		'meta_value' => $h,
		'fields'     => 'ID',
		'number'     => 2,
	) );
	foreach ( $users as $uid ) {
		$tokens = get_user_meta( $uid, 'dsapp_tokens', true );
		if ( ! is_array( $tokens ) || empty( $tokens[ $h ] ) ) continue;
		if ( ( $tokens[ $h ]['exp'] ?? 0 ) < time() ) return 0;
		if ( time() - ( $tokens[ $h ]['used'] ?? 0 ) > HOUR_IN_SECONDS ) {
			$tokens[ $h ]['used'] = time();
			update_user_meta( $uid, 'dsapp_tokens', $tokens );
		}
		return (int) $uid;
	}
	return 0;
}

/* Log the app user in for REST requests that carry a token. Cookie logins are left untouched. */
add_filter( 'determine_current_user', function ( $uid ) {
	if ( $uid ) return $uid;
	$uri = $_SERVER['REQUEST_URI'] ?? '';
	if ( strpos( $uri, '/wp-json/' ) === false && empty( $_GET['rest_route'] ) ) return $uid;
	$token = dsapp_request_token();
	if ( ! $token ) return $uid;
	$found = dsapp_user_for_token( $token );
	return $found ? $found : $uid;
}, 25 );

/** Small per-IP limiter for login attempts and codes. */
function dsapp_rate_ok( $bucket, $max, $window ) {
	$ip  = $_SERVER['REMOTE_ADDR'] ?? '0';
	$key = 'dsapp_rl_' . $bucket . '_' . md5( $ip );
	$n   = (int) get_transient( $key );
	if ( $n >= $max ) return false;
	set_transient( $key, $n + 1, $window );
	return true;
}

function dsapp_user_json( $uid ) {
	$u = get_userdata( $uid );
	if ( ! $u ) return null;
	return array(
		'id'     => (int) $uid,
		'name'   => $u->display_name,
		'email'  => $u->user_email,
		'avatar' => get_avatar_url( $uid, array( 'size' => 128 ) ),
	);
}

/* ------------------------------------------------------------------ routes */

add_action( 'rest_api_init', function () {
	$ns        = 'ds-app/v1';
	$logged_in = function () { return is_user_logged_in(); };

	/* --- login --- */
	register_rest_route( $ns, '/login', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',      // public on purpose: it is the login form
		'callback'            => function ( WP_REST_Request $r ) {
			if ( ! dsapp_rate_ok( 'login', 10, 15 * MINUTE_IN_SECONDS ) ) {
				return new WP_REST_Response( array( 'ok' => false, 'error' => 'Too many tries. Please wait 15 minutes.' ), 429 );
			}
			$login = sanitize_text_field( (string) $r->get_param( 'username' ) );
			$pass  = (string) $r->get_param( 'password' );
			if ( $login === '' || $pass === '' ) {
				return new WP_REST_Response( array( 'ok' => false, 'error' => 'Enter your email and password.' ), 400 );
			}
			if ( is_email( $login ) ) {
				$by = get_user_by( 'email', $login );
				if ( $by ) $login = $by->user_login;
			}
			$user = wp_authenticate( $login, $pass );
			if ( is_wp_error( $user ) ) {
				return new WP_REST_Response( array( 'ok' => false, 'error' => 'Wrong email or password.' ), 401 );
			}
			$token = dsapp_issue_token( $user->ID, (string) $r->get_param( 'device' ) );
			return array( 'ok' => true, 'token' => $token, 'user' => dsapp_user_json( $user->ID ) );
		},
	) );

	/* --- logout (this device) --- */
	register_rest_route( $ns, '/logout', array(
		'methods'             => 'POST',
		'permission_callback' => $logged_in,
		'callback'            => function () {
			$uid    = get_current_user_id();
			$token  = dsapp_request_token();
			$tokens = get_user_meta( $uid, 'dsapp_tokens', true );
			if ( $token && is_array( $tokens ) ) {
				unset( $tokens[ dsapp_hash( $token ) ] );
				update_user_meta( $uid, 'dsapp_tokens', $tokens );
				dsapp_sync_index( $uid, $tokens );
			}
			return array( 'ok' => true );
		},
	) );

	/* --- me: profile + credits + plan + download limits --- */
	register_rest_route( $ns, '/me', array(
		'methods'             => 'GET',
		'permission_callback' => $logged_in,
		'callback'            => function () {
			$uid  = get_current_user_id();
			$out  = array( 'ok' => true, 'user' => dsapp_user_json( $uid ) );
			$plan = function_exists( 'ds_get_user_plan' ) ? ds_get_user_plan( $uid ) : 'free';
			$plans = function_exists( 'ds_get_plans' ) ? ds_get_plans() : array();
			$out['credits']    = function_exists( 'ds_get_credits' ) ? (int) ds_get_credits( $uid ) : 0;
			$out['plan']       = $plan;
			$out['plan_label'] = $plans[ $plan ]['label'] ?? ucfirst( (string) $plan );
			$out['plan_status'] = function_exists( 'ds_get_user_plan_status' ) ? ds_get_user_plan_status( $uid ) : '';
			$out['plan_end']   = function_exists( 'ds_get_subscription_end' ) ? ds_get_subscription_end( $uid ) : '';
			if ( function_exists( 'ds_dl_status_handler' ) ) {
				$res = ds_dl_status_handler( new WP_REST_Request( 'GET', '/ds/v1/dl-status' ) );
				$out['downloads'] = $res instanceof WP_REST_Response ? $res->get_data() : null;
			}
			return $out;
		},
	) );

	/* --- AI images as JSON (newest first) --- */
	register_rest_route( $ns, '/images', array(
		'methods'             => 'GET',
		'permission_callback' => $logged_in,
		'callback'            => function ( WP_REST_Request $r ) {
			$uid   = get_current_user_id();
			$gens  = get_user_meta( $uid, 'ds_ai_generations', true );
			$gens  = is_array( $gens ) ? $gens : array();
			$items = array();
			foreach ( $gens as $i => $g ) {
				if ( ! is_array( $g ) ) continue;
				if ( ( $g['status'] ?? 'succeeded' ) === 'pending' ) continue;
				$urls = array();
				if ( ! empty( $g['images'] ) && is_array( $g['images'] ) ) {
					foreach ( $g['images'] as $im ) {
						$u = is_array( $im ) ? ( $im['url'] ?? '' ) : (string) $im;
						if ( $u ) $urls[] = $u;
					}
				}
				if ( ! $urls && ! empty( $g['url'] ) ) $urls[] = $g['url'];
				foreach ( $urls as $k => $u ) {
					$items[] = array(
						'key'    => $i . '-' . $k,
						'url'    => esc_url_raw( $u ),
						'prompt' => (string) ( $g['prompt'] ?? '' ),
						'model'  => (string) ( $g['model'] ?? '' ),
						'date'   => (string) ( $g['date'] ?? ( $g['created'] ?? '' ) ),
					);
				}
			}
			$items  = array_reverse( $items );
			$offset = max( 0, (int) $r->get_param( 'offset' ) );
			$limit  = min( 60, max( 1, (int) ( $r->get_param( 'limit' ) ?: 30 ) ) );
			return array(
				'ok'          => true,
				'images'      => array_slice( $items, $offset, $limit ),
				'total'       => count( $items ),
				'next_offset' => $offset + $limit,
			);
		},
	) );

	/* --- marketplace categories --- */
	register_rest_route( $ns, '/market/categories', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',      // public, read-only (same as the marketplace page)
		'callback'            => function () {
			$root  = get_term_by( 'name', 'Marketplace', 'dlm_download_category' );
			$terms = get_terms( array(
				'taxonomy'   => 'dlm_download_category',
				'hide_empty' => true,
			) );
			$out = array();
			if ( ! is_wp_error( $terms ) ) {
				foreach ( $terms as $t ) {
					$out[] = array(
						'id'     => (int) $t->term_id,
						'slug'   => $t->slug,
						'name'   => html_entity_decode( $t->name ),
						'parent' => (int) $t->parent,
						'count'  => (int) $t->count,
					);
				}
			}
			return array( 'ok' => true, 'root' => $root ? (int) $root->term_id : 0, 'categories' => $out );
		},
	) );

	/* --- marketplace items --- */
	register_rest_route( $ns, '/market', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',      // public, read-only
		'callback'            => function ( WP_REST_Request $r ) {
			$per  = min( 40, max( 1, (int) ( $r->get_param( 'per_page' ) ?: 24 ) ) );
			$page = max( 1, (int) $r->get_param( 'page' ) );
			$q    = array(
				'post_type'      => 'dlm_download',
				'post_status'    => 'publish',
				'posts_per_page' => $per,
				'paged'          => $page,
				'orderby'        => 'date',
				'order'          => 'DESC',
			);
			$s = sanitize_text_field( (string) $r->get_param( 'search' ) );
			if ( $s !== '' ) $q['s'] = $s;
			$tax = array();
			$cat = sanitize_title( (string) $r->get_param( 'category' ) );
			if ( $cat !== '' ) $tax[] = array( 'taxonomy' => 'dlm_download_category', 'field' => 'slug', 'terms' => $cat );
			$tier = (string) $r->get_param( 'tier' );
			if ( $tier === 'free' || $tier === 'pro' ) {
				$tax[] = array( 'taxonomy' => 'dlm_download_tag', 'field' => 'slug', 'terms' => 'pro', 'operator' => $tier === 'pro' ? 'IN' : 'NOT IN' );
			}
			if ( $tax ) $q['tax_query'] = $tax;
			$query = new WP_Query( $q );
			$items = array();
			foreach ( $query->posts as $p ) {
				$thumb = get_the_post_thumbnail_url( $p->ID, 'medium_large' );
				if ( ! $thumb ) $thumb = get_the_post_thumbnail_url( $p->ID, 'full' );
				$cats = wp_get_post_terms( $p->ID, 'dlm_download_category', array( 'fields' => 'names' ) );
				$items[] = array(
					'id'         => (int) $p->ID,
					'title'      => html_entity_decode( get_the_title( $p ) ),
					'thumb'      => $thumb ? $thumb : '',
					'pro'        => has_term( 'pro', 'dlm_download_tag', $p->ID ),
					'categories' => is_wp_error( $cats ) ? array() : array_map( 'html_entity_decode', $cats ),
					'date'       => get_the_date( 'c', $p ),
				);
			}
			return array(
				'ok'    => true,
				'items' => $items,
				'page'  => $page,
				'pages' => (int) $query->max_num_pages,
				'total' => (int) $query->found_posts,
			);
		},
	) );

	/* --- marketplace download: same daily limits as the website --- */
	register_rest_route( $ns, '/market/download', array(
		'methods'             => 'POST',
		'permission_callback' => $logged_in,
		'callback'            => function ( WP_REST_Request $r ) {
			$id = (int) $r->get_param( 'id' );
			if ( ! $id || get_post_type( $id ) !== 'dlm_download' || get_post_status( $id ) !== 'publish' ) {
				return new WP_REST_Response( array( 'ok' => false, 'error' => 'Item not found.' ), 404 );
			}
			$tier = has_term( 'pro', 'dlm_download_tag', $id ) ? 'pro' : 'free';
			$uid  = get_current_user_id();
			if ( function_exists( 'ds_dl_check_core' ) ) {
				$check = ds_dl_check_core( $uid, $tier, true );     // counts the download, like the website's gate
				if ( empty( $check['ok'] ) ) {
					$reason = $check['reason'] ?? 'not_allowed';
					$msg    = $reason === 'limit_reached'
						? 'You have reached your download limit for today.'
						: ( $tier === 'pro' ? 'This is a Pro item. It is included with a Pro plan.' : 'Download not allowed.' );
					return new WP_REST_Response( array( 'ok' => false, 'reason' => $reason, 'error' => $msg ), $reason === 'limit_reached' ? 429 : 403 );
				}
			}
			$url = dsapp_dlm_file_url( $id );
			if ( ! $url ) return new WP_REST_Response( array( 'ok' => false, 'error' => 'File is not available yet.' ), 404 );
			return array( 'ok' => true, 'url' => $url, 'title' => html_entity_decode( get_the_title( $id ) ) );
		},
	) );

	/* --- one-time code: open a website page inside the app already logged in --- */
	register_rest_route( $ns, '/web-code', array(
		'methods'             => 'POST',
		'permission_callback' => $logged_in,
		'callback'            => function () {
			$code = bin2hex( random_bytes( 20 ) );
			set_transient( 'dsapp_wc_' . $code, get_current_user_id(), 60 );   // valid for 60 seconds, once
			return array( 'ok' => true, 'code' => $code );
		},
	) );
	register_rest_route( $ns, '/web', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',      // the one-time code is the check
		'callback'            => function ( WP_REST_Request $r ) {
			$code = preg_replace( '/[^a-f0-9]/', '', (string) $r->get_param( 'code' ) );
			$to   = (string) $r->get_param( 'to' );
			$path = wp_parse_url( $to, PHP_URL_PATH );
			$qs   = wp_parse_url( $to, PHP_URL_QUERY );
			$dest = home_url( ( $path ? $path : '/' ) . ( $qs ? '?' . $qs : '' ) );   // only pages on this site
			$uid  = $code ? (int) get_transient( 'dsapp_wc_' . $code ) : 0;
			if ( $uid ) {
				delete_transient( 'dsapp_wc_' . $code );
				wp_set_current_user( $uid );
				wp_set_auth_cookie( $uid, true, is_ssl() );
			}
			wp_safe_redirect( $dest );
			exit;
		},
	) );
} );

/** The real file link of a Download Monitor item (latest version). */
function dsapp_dlm_file_url( $id ) {
	try {
		if ( function_exists( 'download_monitor' ) ) {
			$dl = download_monitor()->service( 'download_repository' )->retrieve_single( $id );
			if ( $dl ) {
				$v = $dl->get_version();
				if ( $v ) {
					$m = method_exists( $v, 'get_mirrors' ) ? (array) $v->get_mirrors() : array();
					foreach ( $m as $u ) { if ( is_string( $u ) && preg_match( '#^https?://#', $u ) ) return $u; }
					if ( method_exists( $v, 'get_url' ) ) {
						$u = $v->get_url();
						if ( is_string( $u ) && preg_match( '#^https?://#', $u ) ) return $u;
					}
				}
			}
		}
	} catch ( \Throwable $e ) { /* fall through to meta lookup */ }
	// Fallback: newest version post's _files meta
	$vers = get_posts( array( 'post_type' => 'dlm_download_version', 'post_parent' => $id, 'posts_per_page' => 1, 'orderby' => 'date', 'order' => 'DESC', 'fields' => 'ids' ) );
	if ( $vers ) {
		$files = get_post_meta( $vers[0], '_files', true );
		$files = is_string( $files ) ? json_decode( $files, true ) : $files;
		if ( is_array( $files ) ) {
			foreach ( $files as $u ) { if ( is_string( $u ) && preg_match( '#^https?://#', $u ) ) return $u; }
		}
	}
	return '';
}

/* Let the app call the API from its own screens (React Native sends no browser Origin, so nothing extra is needed);
   the token header must be allowed for the in-app web pages that call the API. */
add_filter( 'rest_allowed_cors_headers', function ( $h ) { $h[] = 'X-DS-App-Token'; return $h; } );
