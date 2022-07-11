import { Notice, Platform } from "obsidian";
import { Fragment, h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import t from "src/l10n";
import { ObsidianIcon } from "src/util";
import CommanderPlugin from "../../main";
import CommandViewer from "./commandViewerComponent";
import Credits from "./Credits";
import HidingViewer from "./hidingViewer";
import { ToggleComponent } from "./settingComponent";

export default function settingTabComponent({ plugin, mobileMode }: { plugin: CommanderPlugin; mobileMode: boolean; }): h.JSX.Element {
	const [activeTab, setActiveTab] = useState(0);
	const [open, setOpen] = useState(true);

	const tabToNextTab = ({ key, shiftKey }: KeyboardEvent): void => {
		if (shiftKey && key === "Tab") {
			if (activeTab > 0) {
				setActiveTab((activeTab - 1) % tabs.length);
			} else {
				setActiveTab(tabs.length - 1);
			}
		} else if (key === "Tab") {
			setActiveTab((activeTab + 1) % tabs.length);
		}
	};

	useEffect(() => {
		addEventListener("keydown", tabToNextTab);
		return () => removeEventListener("keydown", tabToNextTab);
	}, [activeTab]);

	//This is used to remove the initial onclick event listener.
	if (Platform.isMobile) {
		useEffect(() => {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const old_element = document.querySelector(".modal-setting-back-button")!;
			const new_element = old_element.cloneNode(true);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			old_element.parentNode!.replaceChild(new_element, old_element);
			setOpen(true);
		}, []);
	}

	useEffect(() => {
		const el = document.querySelector<HTMLElement>(".modal-setting-back-button");
		if (!el) return;

		if (!open) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			el.lastChild!.textContent = tabs[activeTab].name;
			el.onclick = (): void => setOpen(true);
		} else {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			el.lastChild!.textContent = "Commander";
			el.onclick = (): void => app.setting.closeActiveTab();
		}
	}, [open]);

	const openHiderTab = (idx: number): void => {
		setActiveTab(tabs.length - 1);
		setTimeout(
			() => dispatchEvent(new CustomEvent("cmdr-open-hider-tab", { detail: { index: idx } })),
			50
		);
	};

	const tabs = useMemo(() => [
		{
			name: t("General"),
			tab: <Fragment>
				<ToggleComponent
					name={t("Always ask before removing?")}
					description={t("Always show a Popup to confirm deletion of a Command.")}
					value={plugin.settings.confirmDeletion}
					changeHandler={async (value): Promise<void> => {
						plugin.settings.confirmDeletion = !value;
						await plugin.saveSettings();
					}} />
				<ToggleComponent
					value={plugin.settings.showAddCommand}
					name={t("Show \"Add Command\" Button")}
					description={t("Show the \"Add Command\" Button in every Menu. Requires restart.")}
					changeHandler={async (value): Promise<void> => {
						plugin.settings.showAddCommand = !value;

						if (!plugin.settings.showAddCommand) {
							const elements = document.getElementsByClassName("cmdr-adder");
							for (let i = elements.length - 1; i >= 0; i--) {
								elements.item(i)?.remove();
							}
						} else {
							new Notice(t("Please restart Obsidian for these changes to take effect."));
						}

						await plugin.saveSettings();
					}} />
				<ToggleComponent
					value={plugin.settings.debug}
					name={t("Enable debugging")}
					description={t("Enable console output.")}
					changeHandler={async (value): Promise<void> => {
						plugin.settings.debug = !value;
						await plugin.saveSettings();
					}} />
			</Fragment>
		},
		{
			name: t("Editor Menu"),
			tab: <CommandViewer manager={plugin.manager.editorMenu} plugin={plugin} />
		},
		{
			name: t("File Menu"),
			tab: <CommandViewer manager={plugin.manager.fileMenu} plugin={plugin} />
		},
		{
			name: t("Left Ribbon"),
			tab: <CommandViewer manager={plugin.manager.leftRibbon} plugin={plugin} onOpenHider={(): void => openHiderTab(0)} />
		},
		{
			name: t("Right Ribbon"),
			tab: <CommandViewer manager={plugin.manager.rightRibbon} plugin={plugin} />
		},
		{
			name: t("Titlebar"),
			tab: <CommandViewer manager={plugin.manager.titleBar} plugin={plugin} />
		},
		{
			name: t("Statusbar"),
			tab: <CommandViewer manager={plugin.manager.statusBar} plugin={plugin} onOpenHider={(): void => openHiderTab(1)} />
		},
		{
			name: t("Page Header"),
			tab: <CommandViewer manager={plugin.manager.pageHeader} plugin={plugin} />
		},
		{
			name: t("Hide Commands"),
			tab: <HidingViewer plugin={plugin} />
		}
	], []);

	return (
		<Fragment>
			{Platform.isDesktop && <div className="cmdr-setting-title">
				<h1>{plugin.manifest.name}</h1>
				<Credits />
			</div>}

			{(Platform.isDesktop || open) && <nav class={`cmdr-setting-header ${mobileMode ? "cmdr-mobile" : ""}`}>
				{tabs.map((tab, idx) => <div
					className={activeTab === idx ? "cmdr-tab cmdr-tab-active" : "cmdr-tab"}
					onClick={(): void => { setActiveTab(idx); setOpen(false); }}>
					<span>{tab.name}</span>
					{Platform.isMobile && <ObsidianIcon icon="chevron-right" size={24} />}
				</div>)}
				{Platform.isDesktop && <div className="cmdr-fill" />}
			</nav>}

			<div class={`cmdr-setting-content ${mobileMode ? "cmdr-mobile" : ""}`}>
				{(Platform.isDesktop || !open) && tabs[activeTab].tab}
				{Platform.isMobile && open && <Credits />}
			</div>
		</Fragment>
	);
}
