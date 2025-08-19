/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,

    // CORS config
    async headers() {
        //const allowedOrigin = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "*";

        return [
            {
                source: "/api/:path*",
                headers: [
                    {
                        key: "Access-Control-Allow-Origin",
                        value: '*',
                    },
                    {
                        key: "Access-Control-Allow-Methods",
                        value: "GET, POST, PUT, DELETE, OPTIONS",
                    },
                    {
                        key: "Access-Control-Allow-Headers",
                        value: "Content-Type, Authorization",
                    },
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "same-origin-allow-popups",
                    }
                ],
            },
        ];
    },
};


export default nextConfig;
