import { LogOut, Settings } from "lucide-react";
import { memo } from "react";
import { Link } from "wouter";
import { Main } from "@/components/layout";
import { Logo } from "@/components/ui";
import { routeConfigMap } from "@/router";

const Homepage: React.FC = memo(() => {
  return (
    <Main showNavBar dataTestId="homepage">
      <div className="text-center">
        <div className="max-w-50 mx-auto mb-6">
          <Logo />
        </div>
        <h1>Devbox Services GUI</h1>
        <p>An easy way to manage your devbox services</p>
        <div className="w-full max-w-80 sm:max-w-120 mx-auto mt-10">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              type="button"
              className="btn btn-primary sm:flex-1"
              to={routeConfigMap.homepage.path}
              data-testid="settings-link"
            >
              <Settings /> Go to Homepage
            </Link>
            <button
              type="button"
              className="btn btn-secondary sm:flex-1"
              data-testid="logout-button"
            >
              <LogOut /> Logout
            </button>
          </div>
        </div>
      </div>
    </Main>
  );
});

export default Homepage;
