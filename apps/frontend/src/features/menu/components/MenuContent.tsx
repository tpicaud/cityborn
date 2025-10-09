'use client';

import { ReactNode } from "react";
import { MenuViewSwitcher } from "../contexts/menuViewSwitcher";

interface MenuContentProps {
    homeView: ReactNode;
    playView: ReactNode;
}

export const MenuContent = ({ homeView, playView }: MenuContentProps) => {
    return (
        <MenuViewSwitcher
            homeView={
                <>
                    <MenuViewSwitcher.Trigger view="play">
                        {homeView}
                    </MenuViewSwitcher.Trigger>
                </>
            }
            playView={playView}
        />
    )
}