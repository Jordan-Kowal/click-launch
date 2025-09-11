import { House } from "lucide-react";
import type React from "react";
import { memo, useCallback, useRef } from "react";
import { Link, useLocation } from "wouter";
import { navigationPaths } from "@/router";
import { Modal } from "../ui";

export const NavBar: React.FC = memo(() => {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [location, navigate] = useLocation();

  const handleConfirm = useCallback(async () => {
    await window.electronAPI.stopAllProcesses();
    navigate(navigationPaths.homepage);
  }, [navigate]);

  const onHomeButtonClick = useCallback(() => {
    if (location !== navigationPaths.homepage) {
      modalRef.current?.showModal();
    }
  }, [location]);

  return (
    <div
      data-testid="navbar"
      className="navbar fixed top-0 left-0 shadow-xs not-prose z-999 bg-base-100 drag-region pl-24"
    >
      <div className="navbar-start">
        <Link
          href={navigationPaths.homepage}
          data-testid={"navbar-home-link"}
          className="no-drag"
        >
          <span className="text-xl font-bold">Click Launch</span>
        </Link>
      </div>
      <div className="navbar-end">
        <div className="tooltip tooltip-left" data-tip="Homepage">
          <button
            type="button"
            className="btn btn-ghost btn-circle no-drag"
            onClick={onHomeButtonClick}
            data-testid={"navbar-project-selection-link"}
          >
            <House />
          </button>
        </div>
      </div>
      <Modal ref={modalRef} onConfirm={handleConfirm} closable={true}>
        <h1 className="text-xl font-bold">Return to project selection?</h1>
        <p>Any ongoing processes will be shut down.</p>
      </Modal>
    </div>
  );
});
