import type React from "react";
import { memo } from "react";
import { FadeIn } from "../ui";
import { NAVBAR_HEIGHT } from "./constants";
import { NavBar } from "./NavBar";

export type BaseLayoutProps = {
  children: React.ReactNode;
  className?: string;
  dataTestId?: string;
};

export const BaseLayout: React.FC<BaseLayoutProps> = memo(
  ({ children, className, dataTestId }) => {
    return (
      <main
        className={`flex flex-col w-full h-screen p-6 ${className || ""}`}
        data-testid={dataTestId}
      >
        <NavBar />
        <div
          className="flex-1 w-full"
          style={{
            marginTop: `${NAVBAR_HEIGHT}px`,
            height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
          }}
        >
          <FadeIn>{children}</FadeIn>
        </div>
      </main>
    );
  },
);
