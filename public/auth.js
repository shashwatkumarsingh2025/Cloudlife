// ============================================
// CLOUDLIFE AUTHENTICATION
// ============================================


// Key used to store the Supabase access token

const CLOUDLIFE_TOKEN_KEY =
    "cloudlife_access_token";


// ============================================
// LOGOUT
// ============================================

function cloudLifeLogout() {

    localStorage.removeItem(
        CLOUDLIFE_TOKEN_KEY
    );


    window.location.href =
        "/login.html";
}


// ============================================
// GET STORED TOKEN
// ============================================

function getCloudLifeToken() {

    return localStorage.getItem(
        CLOUDLIFE_TOKEN_KEY
    );
}


// ============================================
// PROTECT DASHBOARD
// ============================================

function protectDashboard() {

    const token =
        getCloudLifeToken();


    if (!token) {

        window.location.href =
            "/login.html";

        return false;
    }


    return true;
}


// ============================================
// ADD TOKEN TO API REQUESTS
// ============================================

const originalFetch =
    window.fetch;


window.fetch =
    async function(resource, options = {}) {

        const token =
            getCloudLifeToken();


        // Only add the token to CloudLife API calls

        if (
            token &&
            typeof resource === "string" &&
            resource.startsWith("/api/")
        ) {

            options.headers =
                options.headers || {};


            if (
                options.headers instanceof Headers
            ) {

                options.headers.set(
                    "Authorization",
                    `Bearer ${token}`
                );

            } else {

                options.headers = {

                    ...options.headers,

                    "Authorization":
                        `Bearer ${token}`

                };

            }

        }


        const response =
            await originalFetch(
                resource,
                options
            );


        // If backend says unauthorized,
        // return the user to login.

        if (
            response.status === 401 &&
            !window.location.pathname.includes(
                "login.html"
            ) &&
            !window.location.pathname.includes(
                "signup.html"
            )
        ) {

            localStorage.removeItem(
                CLOUDLIFE_TOKEN_KEY
            );


            window.location.href =
                "/login.html";

        }


        return response;

    };


// ============================================
// PROTECT MAIN APPLICATION
// ============================================

if (
    !window.location.pathname.includes(
        "login.html"
    ) &&
    !window.location.pathname.includes(
        "signup.html"
    )
) {

    protectDashboard();

}