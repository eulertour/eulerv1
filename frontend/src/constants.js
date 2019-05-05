const DOMAIN = (process.env.REACT_APP_DOMAIN === undefined ?
    'eulertour.com' :
    process.env.REACT_APP_DOMAIN);
export const MEDIA_URL = (process.env.REACT_APP_MEDIA_URL === undefined ?
    'https://media.' + DOMAIN + '/' :
    process.env.REACT_APP_MEDIA_URL);
export const API_URL = (process.env.REACT_APP_API_URL === undefined ?
    'https://api.' + DOMAIN + '/api/' :
    process.env.REACT_APP_API_URL);

export const LOGIN_URL          = API_URL + 'login/';
export const SIGNUP_URL         = API_URL + 'signup/';
export const SESSION_URL        = API_URL + 'session/';

export const RENDER_URL         = API_URL + 'render/';

export const SAVE_URL           = API_URL + 'save/';
export const GET_FILES_URL      = API_URL + 'files/';
export const PROJECT_DELETE_URL = API_URL + 'project/';
export const MODULE_DELETE_URL  = API_URL + 'module/';
export const PROJECTS_URL       = API_URL + 'projects/';

export const CHECK_RENDER_INTERVAL_MS = 2 * 1000;
export const AUTOSAVE_TIMEOUT_MS = 5 * 1000;
export const DEFAULT_LOGS =  'Logs will be displayed here';
export const NO_CHILDREN = [{name: '(empty)', empty: true, readOnly: true}];
export const CHILDREN_NOT_LOADED = [{name: '(loading...)', empty: true, readOnly: true}];
export const UNNAMED_FILE_ID = 'unnamed';
export const MENU_ID = 'menuId';
