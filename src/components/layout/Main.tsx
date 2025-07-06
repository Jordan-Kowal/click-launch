import type React from "react";
import { memo } from "react";
import { FadeIn } from "../ui";
import { NavBar } from "./NavBar";

export type MainProps = {
  children: React.ReactNode;
  className?: string;
  dataTestId?: string;
};

const NAVBAR_HEIGHT = 64;

export const Main: React.FC<MainProps> = memo(
  ({ children, className, dataTestId }) => {
    return (
      <main
        className={`hero w-full ${className || ""}`}
        data-testid={dataTestId}
        style={{
          minHeight: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
          marginTop: `${NAVBAR_HEIGHT}px`,
        }}
      >
        <NavBar />
        <div className="hero-content w-full">
          <div className="max-w-6xl w-full ">
            <FadeIn>{children}</FadeIn>
          </div>
        </div>
      </main>
    );
  },
);
