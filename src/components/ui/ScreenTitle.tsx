import { ArrowLeft } from "lucide-react";
import type React from "react";
import { useLocation } from "wouter";

type ScreenTitleProps = {
  title: string;
  backHref?: string;
};

export const ScreenTitle: React.FC<ScreenTitleProps> = ({
  title,
  backHref,
}) => {
  const [, navigate] = useLocation();
  return (
    <div className="flex items-center gap-1 align-middle">
      {backHref && (
        <button
          type="button"
          className="btn btn-square btn-ghost"
          onClick={() => navigate(backHref)}
          data-testid="back-button"
        >
          <ArrowLeft />
        </button>
      )}
      <h2 className="!m-0">{title}</h2>
    </div>
  );
};
