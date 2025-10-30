'use client';

import { House } from "lucide-react";
import { Button } from "./ui/Button";
import { useRouter } from "next/navigation";

export default function HomeButton() {

    const router = useRouter()

    return (
        <Button variant="outline">
            <House className="h-4 w-4" onClick={() => router.push('/dashboard')}/>
        </Button>
    )
}