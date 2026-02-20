package main

import (
	"embed"
	"log"
	"os"

	"github.com/Jordan-Kowal/click-launch/backend"
	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

//go:embed all:dist
var assets embed.FS

//go:embed public/app-icon.png
var appIcon []byte

// Keep in sync with package.json and build/config.yml
const appVersion = "2.0.0"

func main() {
	app := application.New(application.Options{
		Name:        "Click Launch",
		Description: "Desktop app for managing your local dev stack",
		Icon:        appIcon,
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Services: []application.Service{
			application.NewService(backend.NewConfigService()),
			application.NewService(backend.NewFileService()),
			application.NewService(backend.NewProcessService()),
			application.NewService(backend.NewResourceService()),
			application.NewService(backend.NewAppService(appVersion)),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: false,
			ActivationPolicy: application.ActivationPolicyRegular,
		},
	})

	// Application menu: default macOS menus + custom Help submenu
	menu := application.NewMenu()
	menu.AddRole(application.AppMenu)
	menu.AddRole(application.EditMenu)
	menu.AddRole(application.ViewMenu)
	helpMenu := menu.AddSubmenu("Help")
	helpMenu.Add("Documentation").OnClick(func(_ *application.Context) {
		_ = application.Get().Browser.OpenURL("https://github.com/Jordan-Kowal/click-launch#readme")
	})
	helpMenu.Add("Changelog").OnClick(func(_ *application.Context) {
		_ = application.Get().Browser.OpenURL("https://github.com/Jordan-Kowal/click-launch/blob/main/CHANGELOG.md")
	})
	helpMenu.AddSeparator()
	helpMenu.Add("Version: " + appVersion).SetEnabled(false)
	app.Menu.Set(menu)

	// Main window with macOS hidden title bar
	isDevMode := os.Getenv("FRONTEND_DEVSERVER_URL") != ""
	window := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:  "Click Launch",
		Width:  1200,
		Height: 900,
		URL:    "/",
		Mac: application.MacWindow{
			TitleBar: application.MacTitleBarHiddenInset,
		},
	})

	// Open devtools automatically in dev mode (once, on first show)
	if isDevMode {
		devToolsOpened := false
		window.RegisterHook(events.Common.WindowShow, func(_ *application.WindowEvent) {
			if !devToolsOpened {
				devToolsOpened = true
				window.OpenDevTools()
			}
		})
	}

	// macOS: hide window on close instead of quitting (dock reactivation handled by Wails)
	window.RegisterHook(events.Common.WindowClosing, func(event *application.WindowEvent) {
		event.Cancel()
		window.Hide()
	})

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
