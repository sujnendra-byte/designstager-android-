<?php
/**
 * DesignStager App API — Google & Microsoft login (website + app), and app sign-in through the website.
 *
 * WEBSITE
 *   "Continue with Google" / "Continue with Microsoft" buttons on the Login and Sign Up pages.
 *   New people get an account automatically; existing users are matched by their verified email.
 *   Settings → DesignStager Login holds the Google and Microsoft keys (and shows the redirect links to paste).
 *
 * APP
 *   The app opens  /?ds_app_auth=start&provider=google|microsoft|email&challenge=…  in the phone's secure browser.
 *   After ANY website login (Google, Microsoft or email/password) the browser is sent back to the app with a
 *   one-time code. Only the app that started the login can swap that code for its token (PKCE-style check),
 *   so another app on the phone can't use an intercepted code.
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'DSAPP_MS_CONSUMER_TENANT', '9188040d-6c67-4c5b-b112-36a304b66dad' ); // personal Microsoft accounts
define( 'DSAPP_APP_RETURN', 'designstager://auth' );

/* ------------------------------------------------------------------ settings */

function dsapp_opt( $k ) {
	$o = get_option( 'dsapp_login', array() );
	return is_array( $o ) && isset( $o[ $k ] ) ? trim( (string) $o[ $k ] ) : '';
}
function dsapp_provider_on( $p ) {
	return dsapp_opt( $p . '_id' ) !== '' && dsapp_opt( $p . '_secret' ) !== '';
}
function dsapp_cb_url( $p ) { return home_url( '/?ds_oauth_cb=' . $p ); }

add_action( 'admin_menu', function () {
	add_options_page( 'DesignStager Login', 'DesignStager Login', 'manage_options', 'dsapp-login', 'dsapp_settings_page' );
} );
add_action( 'admin_init', function () {
	register_setting( 'dsapp_login', 'dsapp_login', array(
		'type'              => 'array',
		'sanitize_callback' => function ( $v ) {
			$old = get_option( 'dsapp_login', array() );
			$out = array();
			foreach ( array( 'google_id', 'google_secret', 'microsoft_id', 'microsoft_secret' ) as $k ) {
				$val = isset( $v[ $k ] ) ? sanitize_text_field( $v[ $k ] ) : '';
				// a blank secret box keeps the saved secret
				if ( $val === '' && strpos( $k, 'secret' ) !== false && ! empty( $old[ $k ] ) ) $val = $old[ $k ];
				$out[ $k ] = $val;
			}
			return $out;
		},
	) );
} );

function dsapp_settings_page() {
	$row = function ( $label, $key, $secret = false ) {
		$val = dsapp_opt( $key );
		printf(
			'<tr><th scope="row"><label for="%1$s">%2$s</label></th><td><input type="%3$s" id="%1$s" name="dsapp_login[%1$s]" value="%4$s" class="regular-text" autocomplete="off" placeholder="%5$s"></td></tr>',
			esc_attr( $key ), esc_html( $label ), $secret ? 'password' : 'text',
			$secret ? '' : esc_attr( $val ),
			$secret && $val ? esc_attr__( 'Saved — leave blank to keep' ) : ''
		);
	};
	?>
	<div class="wrap">
		<h1>DesignStager Login — Google &amp; Microsoft</h1>
		<p>These keys turn on "Continue with Google" and "Continue with Microsoft" on the website's Login and Sign Up pages <strong>and</strong> in the DesignStager app. A button only appears once its keys are saved.</p>
		<form method="post" action="options.php">
			<?php settings_fields( 'dsapp_login' ); ?>
			<h2>Google</h2>
			<p>Google Cloud Console → APIs &amp; Services → Credentials → Create credentials → OAuth client ID → <em>Web application</em>.<br>
			Authorised redirect URI: <code><?php echo esc_html( dsapp_cb_url( 'google' ) ); ?></code></p>
			<table class="form-table"><?php $row( 'Client ID', 'google_id' ); $row( 'Client secret', 'google_secret', true ); ?></table>
			<h2>Microsoft</h2>
			<p>Azure portal → Microsoft Entra ID → App registrations → New registration → Supported account types: <em>Accounts in any organizational directory and personal Microsoft accounts</em>.<br>
			Redirect URI (platform <em>Web</em>): <code><?php echo esc_html( dsapp_cb_url( 'microsoft' ) ); ?></code><br>
			Then Certificates &amp; secrets → New client secret (copy the <em>Value</em>).</p>
			<table class="form-table"><?php $row( 'Application (client) ID', 'microsoft_id' ); $row( 'Client secret value', 'microsoft_secret', true ); ?></table>
			<?php submit_button(); ?>
		</form>
	</div>
	<?php
}

/* ------------------------------------------------------------------ buttons on the website */

function dsapp_buttons_html( $return = '' ) {
	$btns = '';
	foreach ( array( 'google' => 'Continue with Google', 'microsoft' => 'Continue with Microsoft' ) as $p => $label ) {
		if ( ! dsapp_provider_on( $p ) ) continue;
		$url   = add_query_arg( array( 'ds_oauth' => $p, 'return' => rawurlencode( $return ) ), home_url( '/' ) );
		$icon  = $p === 'google'
			? '<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>'
			: '<svg width="18" height="18" viewBox="0 0 23 23"><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg>';
		$btns .= '<a class="ds-sso-btn" href="' . esc_url( $url ) . '">' . $icon . '<span>' . esc_html( $label ) . '</span></a>';
	}
	if ( $btns === '' ) return '';
	return '<div class="ds-sso">' . $btns . '<div class="ds-sso-or"><span>or</span></div></div>';
}

add_action( 'login_form', function () { echo dsapp_buttons_html(); } );
add_action( 'register_form', function () { echo dsapp_buttons_html(); } );

$dsapp_sso_css = function () {
	echo '<style>
	.ds-sso{margin:0 0 18px}
	.ds-sso-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;box-sizing:border-box;height:46px;margin:0 0 10px;
	 border:1px solid #d5d9e4;border-radius:10px;background:#fff;color:#141a30;font:500 15px/1 Poppins,system-ui,sans-serif;text-decoration:none}
	.ds-sso-btn:hover{border-color:#141a30;color:#141a30}
	.ds-sso-or{display:flex;align-items:center;gap:10px;color:#6b7190;font-size:13px;margin:6px 0 4px}
	.ds-sso-or:before,.ds-sso-or:after{content:"";flex:1;height:1px;background:#e4e6ef}
	.ds-sso-err{background:#fef2f2;border:1px solid #fecaca;color:#991b1b;padding:10px 12px;border-radius:10px;margin:0 0 14px;font-size:14px}
	</style>';
};
add_action( 'login_head', $dsapp_sso_css );
add_action( 'wp_head', $dsapp_sso_css );

/* Login / Sign Up pages that are normal site pages: put the buttons at the top of the form. */
add_action( 'wp_footer', function () {
	if ( is_user_logged_in() || ! is_page( array( 'login', 'register', 'sign-up', 'signup' ) ) ) return;
	$html = dsapp_buttons_html();
	if ( $html === '' ) return;
	?>
	<script>
	(function(){
		if (document.querySelector('.ds-sso')) return;
		var f = document.querySelector('form#loginform, form#registerform, form[name="loginform"], form[name="registerform"]');
		if (!f) { var pw = document.querySelector('input[type="password"]'); f = pw && pw.form; }
		if (!f) return;
		var w = document.createElement('div'); w.innerHTML = <?php echo wp_json_encode( $html ); ?>;
		f.insertBefore(w.firstChild, f.firstChild);
	})();
	</script>
	<?php
}, 50 );

/* Error message after a failed social login. */
add_filter( 'login_message', function ( $m ) {
	if ( ! empty( $_GET['ds_sso_error'] ) ) {
		$m .= '<div class="ds-sso-err">' . esc_html( dsapp_sso_error_text( sanitize_key( $_GET['ds_sso_error'] ) ) ) . '</div>';
	}
	return $m;
} );
function dsapp_sso_error_text( $k ) {
	$t = array(
		'cancelled' => 'Sign-in was cancelled.',
		'expired'   => 'That sign-in took too long. Please try again.',
		'failed'    => 'We could not sign you in with that account. Please try again.',
		'noemail'   => 'That account did not share a verified email address.',
		'link'      => 'An account with this email already exists. Log in with your password once, then Microsoft sign-in will work next time.',
		'off'       => 'This sign-in option is not available yet.',
	);
	return $t[ $k ] ?? $t['failed'];
}
function dsapp_sso_fail( $k ) {
	// back to the login page with a message (or back to the app, which shows it)
	if ( ! empty( $_COOKIE['ds_app_pending'] ) ) {
		dsapp_clear_pending();
		wp_redirect( DSAPP_APP_RETURN . '?error=' . rawurlencode( $k ) );
		exit;
	}
	wp_safe_redirect( add_query_arg( 'ds_sso_error', $k, wp_login_url() ) );
	exit;
}

/* ------------------------------------------------------------------ OAuth with Google / Microsoft */

function dsapp_provider( $p ) {
	if ( $p === 'google' ) {
		return array(
			'auth'     => 'https://accounts.google.com/o/oauth2/v2/auth',
			'token'    => 'https://oauth2.googleapis.com/token',
			'userinfo' => 'https://openidconnect.googleapis.com/v1/userinfo',
		);
	}
	if ( $p === 'microsoft' ) {
		return array(
			'auth'     => 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
			'token'    => 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
			'userinfo' => 'https://graph.microsoft.com/oidc/userinfo',
		);
	}
	return null;
}

function dsapp_b64url( $bin ) { return rtrim( strtr( base64_encode( $bin ), '+/', '-_' ), '=' ); }

add_action( 'init', function () {
	/* 1) start Google / Microsoft sign-in */
	if ( isset( $_GET['ds_oauth'] ) ) {
		$p = sanitize_key( $_GET['ds_oauth'] );
		$cfg = dsapp_provider( $p );
		if ( ! $cfg || ! dsapp_provider_on( $p ) ) dsapp_sso_fail( 'off' );
		$return  = isset( $_GET['return'] ) ? wp_validate_redirect( rawurldecode( (string) $_GET['return'] ), '' ) : '';
		$state   = dsapp_b64url( random_bytes( 24 ) );
		$verifier = dsapp_b64url( random_bytes( 32 ) );
		set_transient( 'dsapp_st_' . $state, array( 'p' => $p, 'return' => $return, 'v' => $verifier ), 15 * MINUTE_IN_SECONDS );
		$args = array(
			'client_id'             => dsapp_opt( $p . '_id' ),
			'redirect_uri'          => dsapp_cb_url( $p ),
			'response_type'         => 'code',
			'scope'                 => 'openid email profile',
			'state'                 => $state,
			'prompt'                => 'select_account',
			'code_challenge'        => dsapp_b64url( hash( 'sha256', $verifier, true ) ),
			'code_challenge_method' => 'S256',
		);
		if ( $p === 'microsoft' ) $args['response_mode'] = 'query';
		wp_redirect( $cfg['auth'] . '?' . http_build_query( $args, '', '&', PHP_QUERY_RFC3986 ) );
		exit;
	}

	/* 2) Google / Microsoft send the person back here */
	if ( isset( $_GET['ds_oauth_cb'] ) ) {
		$p   = sanitize_key( $_GET['ds_oauth_cb'] );
		$cfg = dsapp_provider( $p );
		if ( ! $cfg ) dsapp_sso_fail( 'failed' );
		if ( ! empty( $_GET['error'] ) ) dsapp_sso_fail( 'cancelled' );
		$state = isset( $_GET['state'] ) ? preg_replace( '/[^A-Za-z0-9_\-]/', '', (string) $_GET['state'] ) : '';
		$st    = $state ? get_transient( 'dsapp_st_' . $state ) : false;
		if ( ! $st || ( $st['p'] ?? '' ) !== $p ) dsapp_sso_fail( 'expired' );
		delete_transient( 'dsapp_st_' . $state );

		$res = wp_remote_post( $cfg['token'], array(
			'timeout' => 20,
			'body'    => array(
				'client_id'     => dsapp_opt( $p . '_id' ),
				'client_secret' => dsapp_opt( $p . '_secret' ),
				'code'          => (string) ( $_GET['code'] ?? '' ),
				'redirect_uri'  => dsapp_cb_url( $p ),
				'grant_type'    => 'authorization_code',
				'code_verifier' => $st['v'],
			),
		) );
		$tok = is_wp_error( $res ) ? null : json_decode( wp_remote_retrieve_body( $res ), true );
		if ( empty( $tok['access_token'] ) ) dsapp_sso_fail( 'failed' );

		$ui = wp_remote_get( $cfg['userinfo'], array( 'timeout' => 20, 'headers' => array( 'Authorization' => 'Bearer ' . $tok['access_token'] ) ) );
		$info = is_wp_error( $ui ) ? null : json_decode( wp_remote_retrieve_body( $ui ), true );
		if ( empty( $info['sub'] ) ) dsapp_sso_fail( 'failed' );

		// id_token came straight from the provider over HTTPS, so its claims can be read without re-checking the signature
		$claims = array();
		if ( ! empty( $tok['id_token'] ) ) {
			$parts = explode( '.', $tok['id_token'] );
			if ( count( $parts ) === 3 ) $claims = json_decode( base64_decode( strtr( $parts[1], '-_', '+/' ) ), true ) ?: array();
		}

		$uid = dsapp_resolve_user( $p, $info, $claims );
		if ( is_string( $uid ) ) dsapp_sso_fail( $uid );

		wp_set_current_user( $uid );
		wp_set_auth_cookie( $uid, true, is_ssl() );
		do_action( 'wp_login', get_userdata( $uid )->user_login, get_userdata( $uid ) );

		if ( ! empty( $_COOKIE['ds_app_pending'] ) ) dsapp_finish_app( $uid );   // started from the app
		wp_safe_redirect( $st['return'] ? $st['return'] : apply_filters( 'login_redirect', home_url( '/' ), '', get_userdata( $uid ) ) );
		exit;
	}

	/* 3) the app asks to sign in through the website */
	if ( isset( $_GET['ds_app_auth'] ) && $_GET['ds_app_auth'] === 'start' ) {
		$challenge = preg_replace( '/[^A-Za-z0-9_\-]/', '', (string) ( $_GET['challenge'] ?? '' ) );
		if ( strlen( $challenge ) < 40 ) wp_die( 'Please start sign-in from the DesignStager app.' );
		$pend = dsapp_b64url( random_bytes( 24 ) );
		set_transient( 'dsapp_pd_' . $pend, $challenge, 20 * MINUTE_IN_SECONDS );
		setcookie( 'ds_app_pending', $pend, array( 'expires' => time() + 20 * MINUTE_IN_SECONDS, 'path' => '/', 'secure' => is_ssl(), 'httponly' => true, 'samesite' => 'Lax' ) );
		$_COOKIE['ds_app_pending'] = $pend;
		$provider = sanitize_key( $_GET['provider'] ?? 'email' );
		if ( in_array( $provider, array( 'google', 'microsoft' ), true ) ) {
			wp_redirect( add_query_arg( array( 'ds_oauth' => $provider ), home_url( '/' ) ) );
			exit;
		}
		if ( is_user_logged_in() ) dsapp_finish_app( get_current_user_id() );   // already logged in on this phone's browser
		wp_redirect( wp_login_url() );
		exit;
	}
}, 1 );

/* After an email/password login (any page it lands on), send a pending app sign-in back to the app. */
add_action( 'template_redirect', 'dsapp_maybe_finish', 1 );
add_action( 'login_init', function () {
	if ( isset( $_GET['action'] ) && $_GET['action'] === 'logout' ) return;
	dsapp_maybe_finish();
} );
function dsapp_maybe_finish() {
	if ( empty( $_COOKIE['ds_app_pending'] ) || ! is_user_logged_in() ) return;
	dsapp_finish_app( get_current_user_id() );
}

function dsapp_clear_pending() {
	if ( ! empty( $_COOKIE['ds_app_pending'] ) ) delete_transient( 'dsapp_pd_' . preg_replace( '/[^A-Za-z0-9_\-]/', '', $_COOKIE['ds_app_pending'] ) );
	setcookie( 'ds_app_pending', '', array( 'expires' => time() - 3600, 'path' => '/', 'secure' => is_ssl(), 'httponly' => true, 'samesite' => 'Lax' ) );
	unset( $_COOKIE['ds_app_pending'] );
}

function dsapp_finish_app( $uid ) {
	$pend      = preg_replace( '/[^A-Za-z0-9_\-]/', '', (string) $_COOKIE['ds_app_pending'] );
	$challenge = $pend ? get_transient( 'dsapp_pd_' . $pend ) : '';
	dsapp_clear_pending();
	if ( ! $challenge ) {
		wp_redirect( DSAPP_APP_RETURN . '?error=expired' );
		exit;
	}
	$code = dsapp_b64url( random_bytes( 24 ) );
	set_transient( 'dsapp_cd_' . $code, array( 'uid' => (int) $uid, 'challenge' => $challenge ), 3 * MINUTE_IN_SECONDS );
	$to = DSAPP_APP_RETURN . '?code=' . rawurlencode( $code );
	nocache_headers();
	header( 'Location: ' . $to, true, 302 );
	// fallback if the browser does not follow the redirect into the app by itself
	echo '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;text-align:center;padding:40px">'
		. '<p>Signed in.</p><p><a href="' . esc_attr( $to ) . '" style="display:inline-block;padding:12px 20px;background:#e7552f;color:#fff;border-radius:10px;text-decoration:none">Return to the DesignStager app</a></p></body>';
	exit;
}

/* The app swaps the one-time code (plus its secret) for its token. */
add_action( 'rest_api_init', function () {
	register_rest_route( 'ds-app/v1', '/exchange', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',      // the one-time code + verifier are the check
		'callback'            => function ( WP_REST_Request $r ) {
			if ( ! dsapp_rate_ok( 'exch', 20, 15 * MINUTE_IN_SECONDS ) ) {
				return new WP_REST_Response( array( 'ok' => false, 'error' => 'Too many tries. Please wait a few minutes.' ), 429 );
			}
			$code     = preg_replace( '/[^A-Za-z0-9_\-]/', '', (string) $r->get_param( 'code' ) );
			$verifier = (string) $r->get_param( 'verifier' );
			$rec      = $code ? get_transient( 'dsapp_cd_' . $code ) : false;
			if ( $code ) delete_transient( 'dsapp_cd_' . $code );          // one use only
			if ( ! $rec || ! hash_equals( (string) $rec['challenge'], dsapp_b64url( hash( 'sha256', $verifier, true ) ) ) ) {
				return new WP_REST_Response( array( 'ok' => false, 'error' => 'Sign-in expired. Please try again.' ), 401 );
			}
			$token = dsapp_issue_token( (int) $rec['uid'], (string) $r->get_param( 'device' ) );
			return array( 'ok' => true, 'token' => $token, 'user' => dsapp_user_json( (int) $rec['uid'] ) );
		},
	) );

	/* which buttons the app should show */
	register_rest_route( 'ds-app/v1', '/login-options', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'callback'            => function () {
			return array( 'ok' => true, 'google' => dsapp_provider_on( 'google' ), 'microsoft' => dsapp_provider_on( 'microsoft' ), 'email' => true );
		},
	) );
} );

/* ------------------------------------------------------------------ match or create the WordPress user */

/** @return int|string user id, or an error key */
function dsapp_resolve_user( $p, $info, $claims ) {
	$sub   = sanitize_text_field( (string) $info['sub'] );
	$key   = 'dsapp_sub_' . $p;
	$email = sanitize_email( (string) ( $info['email'] ?? ( $claims['email'] ?? '' ) ) );
	$name  = sanitize_text_field( (string) ( $info['name'] ?? ( $claims['name'] ?? '' ) ) );

	// 1) already linked
	$found = get_users( array( 'meta_key' => $key, 'meta_value' => $sub, 'fields' => 'ID', 'number' => 1 ) );
	if ( $found ) return (int) $found[0];

	// 2) someone already logged in on the website is linking this account
	if ( is_user_logged_in() ) {
		update_user_meta( get_current_user_id(), $key, $sub );
		return get_current_user_id();
	}

	// Is the email one the provider has verified?
	if ( $p === 'google' ) {
		$verified = ! empty( $info['email_verified'] ) && $info['email_verified'] !== 'false';
	} else {
		// personal Microsoft accounts: the email is the verified sign-in name;
		// work/school accounts: the email field can be set by the organisation, so don't trust it to match accounts
		$verified = ( $claims['tid'] ?? '' ) === DSAPP_MS_CONSUMER_TENANT;
	}
	if ( ! $email ) return 'noemail';

	$existing = get_user_by( 'email', $email );
	if ( $existing ) {
		if ( ! $verified ) return 'link';
		update_user_meta( $existing->ID, $key, $sub );
		return (int) $existing->ID;
	}

	// 3) new person: create a normal account (same as signing up on the website)
	if ( ! get_option( 'users_can_register' ) && ! apply_filters( 'dsapp_allow_social_signup', true ) ) return 'failed';
	$base  = sanitize_user( strstr( $email, '@', true ), true ) ?: 'user';
	$login = $base;
	for ( $i = 1; username_exists( $login ); $i++ ) $login = $base . $i;
	$uid = wp_insert_user( array(
		'user_login'   => $login,
		'user_email'   => $email,
		'user_pass'    => wp_generate_password( 32, true, true ),
		'display_name' => $name ?: $login,
		'first_name'   => sanitize_text_field( (string) ( $info['given_name'] ?? '' ) ),
		'last_name'    => sanitize_text_field( (string) ( $info['family_name'] ?? '' ) ),
		'role'         => get_option( 'default_role', 'subscriber' ),
	) );
	if ( is_wp_error( $uid ) ) return 'failed';
	update_user_meta( $uid, $key, $sub );
	return (int) $uid;
}
