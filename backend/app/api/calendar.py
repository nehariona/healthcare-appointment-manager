from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from google_auth_oauthlib.flow import Flow

from app.core.database import get_db
from app.core.config import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    SECRET_KEY,
    ALGORITHM,
)

from app.api.dependencies import get_current_user
from app.models.user import User

import jwt


router = APIRouter(
    prefix="/calendar",
    tags=["Google Calendar"]
)


# =========================================================
# GOOGLE SCOPES
# =========================================================

GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
]


# =========================================================
# CREATE GOOGLE OAUTH FLOW
# =========================================================

def create_google_flow():

    client_config = {
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,

            "auth_uri": (
                "https://accounts.google.com/o/oauth2/auth"
            ),

            "token_uri": (
                "https://oauth2.googleapis.com/token"
            ),

            "redirect_uris": [
                GOOGLE_REDIRECT_URI
            ],
        }
    }

    flow = Flow.from_client_config(
        client_config,
        scopes=GOOGLE_SCOPES,
        redirect_uri=GOOGLE_REDIRECT_URI,
    )

    return flow


# =========================================================
# START GOOGLE OAUTH
# =========================================================

@router.get("/oauth/authorize")
def authorize_google_calendar(
    current_user: User = Depends(get_current_user)
):

    flow = create_google_flow()

    # -----------------------------------------------------
    # Generate Google authorization URL
    # -----------------------------------------------------

    authorization_url, google_state = (
        flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",
        )
    )

    # -----------------------------------------------------
    # Store our application user ID + PKCE verifier
    #
    # inside a signed JWT.
    # -----------------------------------------------------

    state_payload = {
        "user_id": current_user.id,
        "code_verifier": flow.code_verifier,
    }

    signed_state = jwt.encode(
        state_payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    # -----------------------------------------------------
    # Replace Google's state with our signed state
    # -----------------------------------------------------

    from urllib.parse import (
        urlencode,
        urlparse,
        parse_qs,
    )

    parsed = urlparse(
        authorization_url
    )

    query_params = parse_qs(
        parsed.query
    )

    query_params["state"] = [
        signed_state
    ]

    authorization_url = (
        f"{parsed.scheme}://"
        f"{parsed.netloc}"
        f"{parsed.path}?"
        f"{urlencode(query_params, doseq=True)}"
    )

    return {
        "authorization_url": authorization_url
    }


# =========================================================
# GOOGLE OAUTH CALLBACK
# =========================================================

@router.get("/oauth/callback")
def google_oauth_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db),
):

    # =====================================================
    # 1. VERIFY STATE
    # =====================================================

    try:

        state_data = jwt.decode(
            state,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

    except jwt.ExpiredSignatureError:

        raise HTTPException(
            status_code=400,
            detail="OAuth state has expired",
        )

    except jwt.InvalidTokenError:

        raise HTTPException(
            status_code=400,
            detail="Invalid OAuth state",
        )

    # =====================================================
    # 2. GET USER ID
    # =====================================================

    user_id = state_data.get(
        "user_id"
    )

    code_verifier = state_data.get(
        "code_verifier"
    )

    if not user_id:

        raise HTTPException(
            status_code=400,
            detail="OAuth state does not contain user ID",
        )

    if not code_verifier:

        raise HTTPException(
            status_code=400,
            detail="OAuth state does not contain code verifier",
        )

    # =====================================================
    # 3. FIND APPLICATION USER
    # =====================================================

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="Application user not found",
        )

    # =====================================================
    # 4. CREATE GOOGLE FLOW AGAIN
    # =====================================================

    flow = create_google_flow()

    # =====================================================
    # 5. RESTORE PKCE CODE VERIFIER
    # =====================================================

    flow.code_verifier = code_verifier

    # =====================================================
    # 6. EXCHANGE AUTHORIZATION CODE FOR TOKENS
    # =====================================================

    try:

        flow.fetch_token(
            code=code
        )

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=f"Google OAuth failed: {str(e)}",
        )

    credentials = flow.credentials

    # =====================================================
    # 7. VERIFY ACCESS TOKEN EXISTS
    # =====================================================

    if not credentials.token:

        raise HTTPException(
            status_code=400,
            detail="Google did not return an access token",
        )

    # =====================================================
    # 8. SAVE GOOGLE TOKENS
    # =====================================================

    user.google_access_token = (
        credentials.token
    )

    # Google may not return a refresh token
    # if the account has already authorized the app.

    if credentials.refresh_token:

        user.google_refresh_token = (
            credentials.refresh_token
        )

    user.google_calendar_connected = True

    db.commit()

    # =====================================================
    # 9. SUCCESS
    # =====================================================

    return {
        "message": (
            "Google Calendar connected successfully"
        ),

        "application_email": user.email,

        "google_calendar_connected": True,
    }