package backend

import "testing"

func TestGetVersion(t *testing.T) {
	t.Parallel()
	svc := NewAppService("1.2.3")

	if got := svc.GetVersion(); got != "1.2.3" {
		t.Errorf("expected version 1.2.3, got %s", got)
	}
}

func TestGetResourcePath(t *testing.T) {
	t.Parallel()
	svc := NewAppService("")

	if got := svc.GetResourcePath("logo.png"); got != "/logo.png" {
		t.Errorf("expected /logo.png, got %s", got)
	}
}

func TestGetResourcePath_SubDirectory(t *testing.T) {
	t.Parallel()
	svc := NewAppService("")

	if got := svc.GetResourcePath("images/icon.png"); got != "/images/icon.png" {
		t.Errorf("expected /images/icon.png, got %s", got)
	}
}
