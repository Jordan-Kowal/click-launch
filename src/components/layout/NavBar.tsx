import { Settings } from "lucide-react";
import type React from "react";
import { memo } from "react";
import { Link } from "wouter";
import { routeConfigMap } from "@/router";

export const NavBar: React.FC = memo(() => {
  return (
    <div
      data-testid="navbar"
      className="navbar fixed top-0 left-0 shadow-xs not-prose z-999 bg-base-100 drag-region pl-24"
    >
      <div className="navbar-start">
        <Link
          href={routeConfigMap.homepage.path}
          data-testid={"navbar-home-link"}
          className="no-drag"
        >
          <span className="text-xl font-bold">Devbox Services GUI</span>
        </Link>
      </div>
      <div className="navbar-end">
        <div className="tooltip tooltip-bottom" data-tip="Settings">
          <Link
            type="button"
            className="btn btn-ghost btn-circle no-drag"
            href={routeConfigMap.homepage.path}
            data-testid={"navbar-settings-link"}
          >
            <Settings />
          </Link>
        </div>
      </div>
    </div>
  );
});
