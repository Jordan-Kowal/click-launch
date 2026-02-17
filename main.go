package main

import (
	"embed"
	"log"

	"github.com/Jordan-Kowal/click-launch/backend"
	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:dist
var assets embed.FS

func main() {
	app := application.New(application.Options{
		Name:        "Click Launch",
		Description: "Desktop app for managing your local dev stack",
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Services: []application.Service{
			application.NewService(backend.NewConfigService()),
			application.NewService(backend.NewFileService()),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: false,
			ActivationPolicy: application.ActivationPolicyRegular,
		},
	})

	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:  "Click Launch",
		Width:  1200,
		Height: 900,
		URL:    "/",
		Mac: application.MacWindow{
			TitleBar: application.MacTitleBarHiddenInset,
		},
	})

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
