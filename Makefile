###############################################################################
# Simple-Tiling – Makefile
#
#  make build               → Erzeugt alle vier Versionen als Archivdatei
#  make build-legacy        → Erzeugt Legacy-ZIP (Shell 3.38)
#  make build-enterprise    → Erzeugt Enterprise-ZIP (Shell 40)
#  make build-interim       → Erzeugt Interim-ZIP (Shell 41-44)
#  make build-modern        → Erzeugt Modern-ZIP (Shell 45+)
#  make install-legacy      → Installiert Legacy Extension
#  make install-enterprise  → Installiert Enterprise Extension
#  make install-interim     → Installiert Interim Extension
#  make install-modern      → Installiert Modern Extension
#  make clean               → Bereinigt das Ausgangsverzeichnis
###############################################################################

UUID     := simple-tiling@domoel
VERSION  := 7.5
EXTDIR   := $(HOME)/.local/share/gnome-shell/extensions

COMMON_FILES    := schemas exceptions.txt locale *.css README.md LICENSE
LEGACY_PREFS    := prefs_legacy.js
ENTERPRISE_PREFS:= prefs_enterprise.js
INTERIM_PREFS   := prefs_interim.js
MODERN_PREFS    := prefs_modern.js

###############################################################################
# Helper: copies <file list> <dest>
###############################################################################
define copies
    @for f in $(1) ; do \
        if [ -e $$f ] ; then \
            cp -r $$f $(2)/ ; \
        fi ; \
    done
endef

.PHONY: build build-legacy build-enterprise build-interim build-modern \
        install-legacy install-enterprise install-interim install-modern clean

build: build-legacy build-enterprise build-interim build-modern

###############################################################################
# Erzeugt Legacy-ZIP (Shell 3.38)
###############################################################################
build-legacy:
    @echo "==> Building LEGACY zip (for GNOME 3.38)..."
    @rm -rf build && mkdir -p build/$(UUID)
    $(call copies,$(COMMON_FILES),build/$(UUID))
    @glib-compile-schemas build/$(UUID)/schemas
    @cp legacy.js       build/$(UUID)/extension.js
    @cp $(LEGACY_PREFS)  build/$(UUID)/prefs.js
    @sed -e "s/__UUID__/$(UUID)/g" \
         -e "s/__VERSION__/$(VERSION)/g" \
         metadata_legacy.json.in > build/$(UUID)/metadata.json
    @cd build && zip -qr ../$(UUID)-legacy-v$(VERSION).zip .
    @rm -rf build
    @echo "✓  $(UUID)-legacy-v$(VERSION).zip created"

###############################################################################
# Erzeugt Enterprise-ZIP (Shell 40)
###############################################################################
build-enterprise:
    @echo "==> Building ENTERPRISE zip (for GNOME 40)..."
    @rm -rf build && mkdir -p build/$(UUID)
    $(call copies,$(COMMON_FILES),build/$(UUID))
    @glib-compile-schemas build/$(UUID)/schemas
    @cp enterprise.js       build/$(UUID)/extension.js
    @cp $(ENTERPRISE_PREFS)  build/$(UUID)/prefs.js
    @sed -e "s/__UUID__/$(UUID)/g" \
         -e "s/__VERSION__/$(VERSION)/g" \
         metadata_enterprise.json.in > build/$(UUID)/metadata.json
    @cd build && zip -qr ../$(UUID)-enterprise-v$(VERSION).zip .
    @rm -rf build
    @echo "✓  $(UUID)-enterprise-v$(VERSION).zip created"

###############################################################################
# Erzeugt Interim-ZIP (Shell 41-44)
###############################################################################
build-interim:
    @echo "==> Building INTERIM zip (for GNOME 41-44)..."
    @rm -rf build && mkdir -p build/$(UUID)
    $(call copies,$(COMMON_FILES),build/$(UUID))
    @glib-compile-schemas build/$(UUID)/schemas
    @cp interim.js       build/$(UUID)/extension.js
    @cp $(INTERIM_PREFS)  build/$(UUID)/prefs.js
    @sed -e "s/__UUID__/$(UUID)/g" \
         -e "s/__VERSION__/$(VERSION)/g" \
         metadata_interim.json.in > build/$(UUID)/metadata.json
    @cd build && zip -qr ../$(UUID)-interim-v$(VERSION).zip .
    @rm -rf build
    @echo "✓  $(UUID)-interim-v$(VERSION).zip created"

###############################################################################
# Erzeugt Modern-ZIP (Shell 45+)
###############################################################################
build-modern:
    @echo "==> Building MODERN zip (for GNOME 45+)..."
    @rm -rf build && mkdir -p build/$(UUID)
    $(call copies,$(COMMON_FILES),build/$(UUID))
    @glib-compile-schemas build/$(UUID)/schemas
    @cp modern.js       build/$(UUID)/extension.js
    @cp $(MODERN_PREFS)  build/$(UUID)/prefs.js
    @sed -e "s/__UUID__/$(UUID)/g" \
         -e "s/__VERSION__/$(VERSION)/g" \
         metadata_modern.json.in > build/$(UUID)/metadata.json
    @cd build && zip -qr ../$(UUID)-modern-v$(VERSION).zip .
    @rm -rf build
    @echo "✓  $(UUID)-modern-v$(VERSION).zip created"

###############################################################################
# Installiert die verschiedenen Versionen
###############################################################################
install-legacy: build-legacy
    @echo "==> Installing LEGACY Extension..."
    @rm -rf $(EXTDIR)/$(UUID)
    @unzip -q $(UUID)-legacy-v$(VERSION).zip -d $(EXTDIR)/$(UUID)
    @rm -f $(UUID)-legacy-v$(VERSION).zip
    @echo "✓  Legacy Extension installed to $(EXTDIR)/$(UUID). Restart GNOME Shell to apply."

install-enterprise: build-enterprise
    @echo "==> Installing ENTERPRISE Extension..."
    @rm -rf $(EXTDIR)/$(UUID)
    @unzip -q $(UUID)-enterprise-v$(VERSION).zip -d $(EXTDIR)/$(UUID)
    @rm -f $(UUID)-enterprise-v$(VERSION).zip
    @echo "✓  Enterprise Extension installed to $(EXTDIR)/$(UUID). Restart GNOME Shell to apply."

install-interim: build-interim
    @echo "==> Installing INTERIM Extension..."
    @rm -rf $(EXTDIR)/$(UUID)
    @unzip -q $(UUID)-interim-v$(VERSION).zip -d $(EXTDIR)/$(UUID)
    @rm -f $(UUID)-interim-v$(VERSION).zip
    @echo "✓  Interim Extension installed to $(EXTDIR)/$(UUID). Restart GNOME Shell to apply."

install-modern: build-modern
    @echo "==> Installing MODERN Extension..."
    @rm -rf $(EXTDIR)/$(UUID)
    @unzip -q $(UUID)-modern-v$(VERSION).zip -d $(EXTDIR)/$(UUID)
    @rm -f $(UUID)-modern-v$(VERSION).zip
    @echo "✓  Modern Extension installed to $(EXTDIR)/$(UUID). Restart GNOME Shell to apply."

###############################################################################
# Bereinigt das Ausgangsverzeichnis
###############################################################################
clean:
    @rm -f $(UUID)-*.zip
    @echo "Build directory and ZIPs removed."
