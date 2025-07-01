/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,

    // CORS config
    async headers() {
        const allowedOrigin = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "*";

        return [
            {
                source: "/api/:path*",
                headers: [
                    {
                        key: "Access-Control-Allow-Origin",
                        value: allowedOrigin,
                    },
                    {
                        key: "Access-Control-Allow-Methods",
                        value: "GET, POST, PUT, DELETE, OPTIONS",
                    },
                    {
                        key: "Access-Control-Allow-Headers",
                        value: "Content-Type, Authorization",
                    },
                ],
            },
        ];
    },
};


export default nextConfig;
