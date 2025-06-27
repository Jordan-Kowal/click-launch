import { Toaster } from "@/components/ui";
import "@/config/dayjs";
import { ThemeProvider } from "@/contexts";
import { Routes } from "@/router";
import "@/styles/base.css";
import { memo } from "react";
import { Router } from "wouter";

export const App: React.FC = memo(() => {
  return (
    <ThemeProvider>
      <Router>
        <Routes />
      </Router>
      <Toaster />
    </ThemeProvider>
  );
});
