'use client';

import CountdownTimer from "@/components/guess/CountdownComponent";

export default function  Timer() {

    return (
        <CountdownTimer totalTime={15} endMessage={"Time !"} />
    );
}
