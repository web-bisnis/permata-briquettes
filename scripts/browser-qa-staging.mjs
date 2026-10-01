import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const baseUrlIndex = args.indexOf("--base-url");
const BASE_URL = baseUrlIndex === -1 ? "https://staging.permatabriquettes.com" : args[baseUrlIndex + 1];
const outputIndex = args.indexOf("--output");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputPath = resolve(outputIndex === -1 ? "reports/audits/08-browser.json" : args[outputIndex + 1]);
const screenshotDirectory = resolve(
  outputIndex === -1 ? "reports/audits/08-browser-screenshots" : `${dirname(args[outputIndex + 1])}/08-browser-local-screenshots`,
);
const routes = JSON.parse(readFileSync(resolve("reports/audits/07-staging.json"), "utf8"))
  .pages.map((page) => page.route);
const viewports = [
  { name: "mobile", width: 360, height: 800, mobile: true },
  { name: "tablet", width: 768, height: 1024, mobile: false },
  { name: "desktop", width: 1440, height: 1000, mobile: false },
];
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function wait(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

class CdpClient {
  constructor(url) {
    this.id = 0;
    this.pending = new Map();
    this.socket = new WebSocket(url);
    this.ready = new Promise((resolvePromise, reject) => {
      this.socket.addEventListener("open", resolvePromise, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`));
      else pending.resolve(message.result);
    });
  }

  async send(method, params = {}) {
    await this.ready;
    const id = ++this.id;
    return new Promise((resolvePromise, reject) => {
      this.pending.set(id, { resolve: resolvePromise, reject, method });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket.close();
  }
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? "Browser evaluation failed");
  return result.result.value;
}

async function navigate(client, route) {
  await client.send("Page.navigate", { url: `${BASE_URL}${route}` });
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const ready = await evaluate(client, "document.readyState");
    if (ready === "complete") return;
    await wait(50);
  }
  throw new Error(`Timed out loading ${route}`);
}

async function setViewport(client, viewport) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
  });
}

async function pressKey(client, key, code, windowsVirtualKeyCode) {
  const params = { key, code, windowsVirtualKeyCode, nativeVirtualKeyCode: windowsVirtualKeyCode };
  const text = key === "Enter" ? "\r" : key === " " ? " " : undefined;
  await client.send("Input.dispatchKeyEvent", { ...params, type: "keyDown", text });
  await client.send("Input.dispatchKeyEvent", { ...params, type: "keyUp" });
}

function activeElementExpression() {
  return `(() => {
    const element = document.activeElement;
    if (!element) return null;
    const style = getComputedStyle(element);
    return {
      tag: element.tagName.toLowerCase(),
      id: element.id,
      classes: element.className,
      text: (element.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 120),
      href: element.getAttribute("href"),
      value: element.value,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      visible: Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length),
    };
  })()`;
}

if (!existsSync(CHROME)) throw new Error(`Chrome not found at ${CHROME}`);
const profileDirectory = mkdtempSync(join(tmpdir(), "permata-final-qa-"));
const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-background-networking",
  "--disable-component-update",
  "--disable-default-apps",
  "--disable-extensions",
  "--disable-sync",
  "--no-first-run",
  "--no-default-browser-check",
  "--remote-debugging-port=0",
  `--user-data-dir=${profileDirectory}`,
  "about:blank",
], { stdio: "ignore", windowsHide: true });

let client;
try {
  const portFile = join(profileDirectory, "DevToolsActivePort");
  for (let attempt = 0; attempt < 100 && !existsSync(portFile); attempt += 1) await wait(50);
  if (!existsSync(portFile)) throw new Error("Chrome DevTools port did not become available");
  const port = Number(readFileSync(portFile, "utf8").split(/\r?\n/u)[0]);
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target = targets.find((entry) => entry.type === "page");
  if (!target) throw new Error("Chrome page target is unavailable");
  client = new CdpClient(target.webSocketDebuggerUrl);
  await client.ready;
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Accessibility.enable");

  const responsive = [];
  for (const viewport of viewports) {
    await setViewport(client, viewport);
    for (const route of routes) {
      await navigate(client, route);
      const metrics = await evaluate(client, `(() => {
        const visible = (element) => {
          const style = getComputedStyle(element);
          const closedDetails = element.closest("details:not([open])");
          const hiddenByDetails = closedDetails && element !== closedDetails && element.tagName !== "SUMMARY";
          return !hiddenByDetails && style.display !== "none" && style.visibility !== "hidden" && Boolean(element.getClientRects().length);
        };
        const viewportWidth = document.documentElement.clientWidth;
        const offenders = [...document.body.querySelectorAll("*")].filter((element) => {
          if (!visible(element)) return false;
          const rect = element.getBoundingClientRect();
          if (rect.width === 0) return false;
          const scrollParent = element.closest(".prose > table");
          if (scrollParent && scrollParent.scrollWidth > scrollParent.clientWidth) return false;
          return rect.left < -1 || rect.right > viewportWidth + 1;
        }).slice(0, 8).map((element) => ({
          tag: element.tagName.toLowerCase(),
          classes: element.className,
          left: Math.round(element.getBoundingClientRect().left),
          right: Math.round(element.getBoundingClientRect().right),
        }));
        const withinViewport = (selector) => [...document.querySelectorAll(selector)].every((element) => {
          const rect = element.getBoundingClientRect();
          return rect.left >= -1 && rect.right <= viewportWidth + 1;
        });
        return {
          url: location.href,
          viewportWidth,
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
          horizontalOverflow: document.documentElement.scrollWidth > viewportWidth + 1,
          offenders,
          menuSummaryDisplay: document.querySelector(".site-navigation summary")
            ? getComputedStyle(document.querySelector(".site-navigation summary")).display
            : null,
          tableCount: document.querySelectorAll("table").length,
          horizontallyScrollableTables: [...document.querySelectorAll(".prose > table")]
            .filter((table) => table.scrollWidth > table.clientWidth).length,
          footerWithinViewport: withinViewport(".site-footer"),
          addressWithinViewport: withinViewport(".contact-address"),
          ctaWithinViewport: withinViewport(".contact-action"),
          themeControlWithinViewport: withinViewport(".theme-control"),
          languageSwitchCount: [...document.querySelectorAll("a[hreflang]")].filter(visible).length,
          visibleCtas: [...document.querySelectorAll('.contact-action[href^="mailto:"], .contact-action[href^="https://wa.me/"]')]
            .filter(visible).length,
        };
      })()`);
      assert(!metrics.horizontalOverflow, `${viewport.name} ${route}: horizontal page overflow`);
      assert(metrics.offenders.length === 0, `${viewport.name} ${route}: elements outside viewport`);
      assert(metrics.footerWithinViewport, `${viewport.name} ${route}: footer exceeds viewport`);
      assert(metrics.addressWithinViewport, `${viewport.name} ${route}: address exceeds viewport`);
      assert(metrics.ctaWithinViewport, `${viewport.name} ${route}: CTA exceeds viewport`);
      assert(metrics.themeControlWithinViewport, `${viewport.name} ${route}: theme control exceeds viewport`);
      responsive.push({ viewport: viewport.name, route, ...metrics });
    }
  }

  await setViewport(client, viewports[0]);
  await navigate(client, "/en/contact/");
  await evaluate(client, "document.documentElement.removeAttribute('data-theme'); localStorage.removeItem('theme'); document.body.focus(); document.activeElement?.blur()");
  await pressKey(client, "Tab", "Tab", 9);
  const skipFocus = await evaluate(client, activeElementExpression());
  assert(skipFocus?.classes.includes("skip-link"), "keyboard: first Tab does not focus skip link");
  assert(skipFocus?.visible, "keyboard: focused skip link is not visible");
  assert(skipFocus?.outlineStyle !== "none" && skipFocus?.outlineWidth !== "0px", "keyboard: skip link lacks focus ring");
  await pressKey(client, "Enter", "Enter", 13);
  const skipActivation = await evaluate(client, "({ hash: location.hash, activeId: document.activeElement?.id })");
  assert(skipActivation.hash === "#main-content", "keyboard: skip link does not target #main-content");
  assert(skipActivation.activeId === "main-content", "keyboard: skip link does not move focus to main");

  await navigate(client, "/en/contact/");
  await evaluate(client, "document.body.focus(); document.activeElement?.blur()");
  const focusOrder = [];
  for (let index = 0; index < 3; index += 1) {
    await pressKey(client, "Tab", "Tab", 9);
    focusOrder.push(await evaluate(client, activeElementExpression()));
  }
  assert(focusOrder[0]?.classes.includes("skip-link"), "keyboard: skip link is not first");
  assert(focusOrder[1]?.classes.includes("site-home"), "keyboard: home link is not second");
  assert(focusOrder[2]?.tag === "summary", "keyboard: mobile menu is not third");
  await pressKey(client, "Enter", "Enter", 13);
  const menuOpen = await evaluate(client, "document.querySelector('.site-navigation')?.open");
  assert(menuOpen === true, "keyboard: Enter does not open mobile menu");
  for (let index = 0; index < 14; index += 1) {
    await pressKey(client, "Tab", "Tab", 9);
    focusOrder.push(await evaluate(client, activeElementExpression()));
  }
  const focusHrefs = focusOrder.map((entry) => entry?.href).filter(Boolean);
  const focusedControls = focusOrder.filter((entry) => entry?.tag !== "body");
  assert(focusedControls.every((entry) => entry?.visible), "keyboard: focus reached an invisible control");
  assert(focusedControls.every((entry) => entry?.outlineStyle !== "none" && entry?.outlineWidth !== "0px"), "keyboard: a focusable element lacks focus ring");
  assert(focusHrefs.includes("/id/kontak/"), "keyboard: language switch was not reached");
  assert(focusOrder.some((entry) => entry?.id === "theme-select"), "keyboard: theme control was not reached");
  assert(focusHrefs.includes("mailto:marketing@permatabriquettes.com"), "keyboard: email CTA was not reached");
  assert(focusHrefs.includes("https://wa.me/6281130887797"), "keyboard: WhatsApp CTA was not reached");

  const themes = [];
  for (const mode of ["system-light", "system-dark", "light", "dark"]) {
    const systemMode = mode.startsWith("system-") ? mode.slice(7) : "light";
    await client.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-color-scheme", value: systemMode }],
    });
    const selectValue = mode.startsWith("system-") ? "system" : mode;
    const theme = await evaluate(client, `(() => {
      const select = document.querySelector("#theme-select");
      select.value = ${JSON.stringify(selectValue)};
      select.dispatchEvent(new Event("change", { bubbles: true }));
      const rootStyle = getComputedStyle(document.documentElement);
      return {
        requested: ${JSON.stringify(mode)},
        selected: select.value,
        dataTheme: document.documentElement.dataset.theme || null,
        stored: localStorage.getItem("theme"),
        background: rootStyle.getPropertyValue("--color-background").trim(),
        text: rootStyle.getPropertyValue("--color-text").trim(),
      };
    })()`);
    if (selectValue === "system") {
      assert(theme.dataTheme === null && theme.stored === null, `${mode}: system theme did not clear override`);
    } else {
      assert(theme.dataTheme === mode && theme.stored === mode, `${mode}: explicit theme was not persisted`);
    }
    themes.push(theme);
  }
  assert(themes[0].background !== themes[1].background, "system theme does not respond to OS light/dark preference");
  assert(themes[2].background !== themes[3].background, "explicit light/dark themes are visually identical");

  await setViewport(client, viewports[2]);
  await navigate(client, "/en/contact/");
  const desktopNavigation = await evaluate(client, `(() => ({
    summaryDisplay: getComputedStyle(document.querySelector(".site-navigation summary")).display,
    panelDisplay: getComputedStyle(document.querySelector(".site-navigation__panel")).display,
    visibleNavLinks: [...document.querySelectorAll(".site-navigation__link")]
      .filter((element) => Boolean(element.getClientRects().length)).length,
  }))()`);
  assert(desktopNavigation.summaryDisplay === "none", "desktop: mobile menu summary remains visible");
  assert(desktopNavigation.panelDisplay === "flex", "desktop: navigation panel is hidden");
  assert(desktopNavigation.visibleNavLinks === 7, "desktop: navigation or language switch is missing");

  const axTree = await client.send("Accessibility.getFullAXTree");
  const axNodes = axTree.nodes.map((node) => ({
    role: node.role?.value,
    name: node.name?.value,
    ignored: node.ignored,
  })).filter((node) => !node.ignored);
  const roles = axNodes.map((node) => node.role);
  const unnamedInteractive = axNodes.filter((node) => ["link", "button", "combobox"].includes(node.role) && !node.name);
  assert(roles.includes("banner"), "accessibility tree: banner landmark missing");
  assert(roles.includes("main"), "accessibility tree: main landmark missing");
  assert(roles.includes("contentinfo"), "accessibility tree: contentinfo landmark missing");
  assert(roles.filter((role) => role === "navigation").length >= 2, "accessibility tree: navigation landmarks missing");
  assert(unnamedInteractive.length === 0, "accessibility tree: unnamed interactive control found");

  mkdirSync(screenshotDirectory, { recursive: true });
  const screenshots = [
    { route: "/en/contact/", viewport: viewports[0], file: "contact-mobile-dark.png", theme: "dark" },
    { route: "/en/contact/", viewport: viewports[0], file: "contact-mobile-menu-dark.png", theme: "dark", menuOpen: true },
    { route: "/en/contact/", viewport: viewports[0], file: "contact-mobile-footer-dark.png", theme: "dark", scrollBottom: true },
    { route: "/en/products/coconut-charcoal-briquettes-for-shisha/", viewport: viewports[1], file: "product-tablet-light.png", theme: "light" },
    { route: "/id/kualitas-dokumen/", viewport: viewports[2], file: "quality-desktop-system.png", theme: "system" },
  ];
  for (const screenshot of screenshots) {
    await setViewport(client, screenshot.viewport);
    await navigate(client, screenshot.route);
    await evaluate(client, `(async () => {
      const select = document.querySelector("#theme-select");
      select.value = ${JSON.stringify(screenshot.theme)};
      select.dispatchEvent(new Event("change", { bubbles: true }));
      if (${Boolean(screenshot.menuOpen)}) document.querySelector(".site-navigation").open = true;
      await document.fonts.ready;
      if (${Boolean(screenshot.scrollBottom)}) {
        window.scrollTo(0, document.documentElement.scrollHeight);
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }
      return true;
    })()`);
    const captureOptions = { format: "png", fromSurface: true };
    if (screenshot.scrollBottom) {
      const layout = await client.send("Page.getLayoutMetrics");
      captureOptions.captureBeyondViewport = true;
      captureOptions.clip = {
        x: 0,
        y: Math.max(0, layout.cssContentSize.height - screenshot.viewport.height),
        width: screenshot.viewport.width,
        height: screenshot.viewport.height,
        scale: 1,
      };
    }
    const capture = await client.send("Page.captureScreenshot", captureOptions);
    writeFileSync(join(screenshotDirectory, screenshot.file), Buffer.from(capture.data, "base64"));
  }

  const result = {
    generatedAt: new Date().toISOString(),
    target: BASE_URL,
    browser: "Google Chrome headless via DevTools Protocol",
    status: failures.length === 0 ? "pass" : "fail",
    summary: { routes: routes.length, viewports: viewports.length, routeViewportChecks: responsive.length, failures: failures.length },
    viewports,
    responsive,
    keyboard: { skipFocus, skipActivation, menuOpen, focusOrder },
    themes,
    desktopNavigation,
    accessibility: {
      nodeCount: axNodes.length,
      landmarkRoles: roles.filter((role) => ["banner", "main", "contentinfo", "navigation"].includes(role)),
      unnamedInteractive,
    },
    screenshots: screenshots.map((screenshot) => ({ ...screenshot, path: join(screenshotDirectory, screenshot.file) })),
    failures,
  };
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  process.stdout.write(`${result.status.toUpperCase()}: ${responsive.length} responsive route/viewport checks; ${failures.length} failures; output ${outputPath}\n`);
  if (failures.length > 0) process.exitCode = 1;
} finally {
  client?.close();
  chrome.kill();
  await wait(200);
  rmSync(profileDirectory, { recursive: true, force: true });
}
