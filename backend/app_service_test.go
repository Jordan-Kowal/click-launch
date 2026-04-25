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

func TestValidVersionPattern(t *testing.T) {
	t.Parallel()
	valid := []string{"0.0.1", "1.2.3", "10.20.30", "999.999.999"}
	for _, v := range valid {
		t.Run("valid/"+v, func(t *testing.T) {
			t.Parallel()
			if !validVersionPattern.MatchString(v) {
				t.Errorf("expected %q to match", v)
			}
		})
	}

	invalid := []string{"", "1", "1.2", "1.2.3.4", "v1.2.3", "1.2.3-beta", "abc", "1.2.x", " 1.2.3", "1.2.3 "}
	for _, v := range invalid {
		label := v
		if label == "" {
			label = "(empty)"
		}
		t.Run("invalid/"+label, func(t *testing.T) {
			t.Parallel()
			if validVersionPattern.MatchString(v) {
				t.Errorf("expected %q to NOT match", v)
			}
		})
	}
}
