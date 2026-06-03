function toggleAuthView() {
    // === CHOOSE YOUR SECRET INVITE CODE HERE ===
    const SECRET_INVITE_CODE = "MAGESTICA2026"; 

    // Read the link to see if "?invite=YOURCODE" is attached
    const urlParams = new URLSearchParams(window.location.search);
    const playerInviteInput = urlParams.get('invite');

    if (!isSignUpView) {
        // Player is trying to switch from Login to Sign Up view
        if (playerInviteInput !== SECRET_INVITE_CODE) {
            const status = document.getElementById('auth-status');
            status.className = "text-red-400 text-xs mt-2 font-mono";
            status.innerText = "ACCESS_DENIED: Secure invitation token invalid or missing.";
            return;
        }
    }

    // If code matches, proceed with opening the matrix fields
    isSignUpView = !isSignUpView;
    const title = document.getElementById('modal-title');
    const toggleLink = document.getElementById('auth-toggle-view');
    const submitBtn = document.getElementById('auth-submit-btn');
    const onboarding = document.getElementById('onboarding-fields');

    if (isSignUpView) {
        title.innerText = "// REGISTRATION_MATRIX";
        toggleLink.innerText = "Return to secure node login";
        submitBtn.innerText = "CREATE_MATRIX_IDENTITY";
        onboarding.classList.remove('hidden');
    } else {
        title.innerText = "// IDENTITY_VERIFICATION";
        toggleLink.innerText = "Need to create a new matrix profile? Sign up";
        submitBtn.innerText = "INITIALIZE_SESSION";
        onboarding.classList.add('hidden');
    }
}
