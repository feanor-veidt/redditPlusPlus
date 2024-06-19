import { Database, DatabaseConfig, ICleanupableData } from '../../utils/database';
import { notify, pp_log } from '../toaster';
import { renderFlairBar } from './flairBar';
import { css } from '../customCSS';
import style from './subs.less';
import { FlairData } from './flair';
import { checkIsRendered, dynamicElement } from '../../utils/tools';
import { flairsWindow } from './flairWindow';

css.addStyle(style);

export const FLAIR_HIDDEN: string = `hidden`;
export const FLAIR_BANNED: string = `banned`;

class SubFlairsData {
    hidden: Array<string>;
    banned: Array<string>;
}

class SubData implements ICleanupableData {
    timestamp: number;

    flairs: Array<FlairData>;
}

export const flairs: Database<SubFlairsData> = new Database<SubFlairsData>(`FLAIRS`);
export const subs: Database<SubData> = new Database<SubData>(`SUBS`, { isCleanupable: true, validator: subDataValidator, loader: subDataLoader } as DatabaseConfig<SubData>);

function subDataValidator(subData: SubData) {
    return subData.flairs == undefined;
}

async function subDataLoader(sub: string): Promise<SubData> {
    let subData = {} as SubData;

    const response = await fetch(`https://www.reddit.com/r/${sub}/api/link_flair_v2.json?raw_json=1`, { cache: `no-cache`, method: `get` });
    const json = await response.json();

    const loadedFlairs = [] as Array<FlairData>;

    if (json != null) {
        for (const loadedFlair of json) {
            const flair = { text: loadedFlair.text, color: loadedFlair.text_color, background: loadedFlair.background_color, richtext: loadedFlair.richtext } as FlairData;

            loadedFlairs.push(flair);
        }

        subData.flairs = loadedFlairs;

        return subData;
    } else {
        subData.flairs = loadedFlairs;

        pp_log(`Unable to load r/${sub} flairs data`);

        return subData;
    }
}

export function getCurrentSub(): string {
    const raw = window.location.href.split(`reddit.com/r/`);
    return raw.length > 1 ? raw[1].split(`/`)[0] : null;
}

export async function renderSub(main: Element) {
    // skip page without feed
    const checkIsFeed = main.querySelector(`shreddit-feed-error-banner`);
    if (checkIsFeed == null) return;

    renderMasthead(main);

    renderFlairBar(main);
}

async function renderMasthead(main: Element) {
    const masthead = await dynamicElement(() => main.parentElement.parentElement.querySelector(`.masthead`));

    if (checkIsRendered(masthead)) return;

    masthead.querySelector(`section`).classList.add(`pp_mastheadSection`);

    document.body.addEventListener(`click`, renderContextMenu);
}

function renderContextMenu(e: MouseEvent) {
    const targetElement = e.target as Element;

    if (targetElement.matches(`shreddit-subreddit-header-buttons`) != true) return;

    if (checkIsRendered(targetElement)) return;

    const controlMenu = targetElement.shadowRoot.querySelector(`shreddit-subreddit-overflow-control`).shadowRoot.querySelector(`faceplate-menu`);

    const originButton = controlMenu.querySelector(`li`);

    // flairs settings
    const menuFlairsButton = originButton.cloneNode(true) as Element;
    menuFlairsButton.querySelector(`.text-14`).textContent = `Flairs settings`;
    controlMenu.prepend(menuFlairsButton);

    const sub = getCurrentSub();

    menuFlairsButton.addEventListener(`click`, () => {
        flairsWindow.open({ sub: sub });
    });

    // about
    const link = document.createElement(`a`);
    link.href = `https://www.reddit.com/` + targetElement.getAttribute(`prefixed-name`) + `/about/`;
    link.classList.add(`no-underline`);
    controlMenu.prepend(link);

    const menuAboutButton = originButton.cloneNode(true) as Element;
    menuAboutButton.querySelector(`.text-14`).textContent = `About`;
    link.prepend(menuAboutButton);
}
