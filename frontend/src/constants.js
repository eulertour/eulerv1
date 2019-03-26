const DOMAIN = (process.env.REACT_APP_DOMAIN === undefined ?
                'eulertour.com' :
                process.env.REACT_APP_DOMAIN);
export const MEDIA_URL = 'https://media.' + DOMAIN + '/';
export const API_URL   = 'https://api.' + DOMAIN + '/api/';

export const LOGIN_URL          = API_URL + 'login/';
export const SIGNUP_URL         = API_URL + 'signup/';
export const SESSION_URL        = API_URL + 'session/';

export const RENDER_URL         = API_URL + 'render/';

export const SAVE_URL           = API_URL + 'save/';
export const GET_FILES_URL      = API_URL + 'files/';
export const PROJECT_DELETE_URL = API_URL + 'project/';
export const MODULE_DELETE_URL  = API_URL + 'module/';

export const CHECK_RENDER_INTERVAL_MS = 2 * 1000;
export const AUTOSAVE_TIMEOUT_MS = 5 * 1000;
export const DEFAULT_LOGS =  'Logs will be displayed here';
export const DEFAULT_SELECTED_SCENE = 'No Scene selected';
export const NO_CHILDREN = [{name: '(empty)', empty: true, readOnly: true}];
export const CHILDREN_NOT_LOADED = [{name: '(loading...)', empty: true, readOnly: true}];
export const EXAMPLE_NODES = [
  {
    id: 0,
    name: 'Leaf 1',
    state: {
      expanded: true,
    },
    children: [
      {
        id: 2,
        name: 'Leaf 2',
        state: {
          expanded: true,
          deletable: true,
        },
        children: [
          {
            id: 3,
            name: 'Leaf 3',
            state: {
              expanded: false,
              favorite: true,
              deletable: true,
            },
            children: [
              {
                id: 'c-3',
                name: 'Leaf 3 Child',
                state: {},
              },
            ],
          },
          {
            id: 4,
            name: 'Leaf 4',
          },
        ],
      },
      {
        id: 5,
        name: 'Leaf 5',
      },
    ],
  },
  {
    id: 1,
    name: 'Leaf 6',
    state: {
      expanded: false,
      deletable: true,
    },
    children: [
      {
        id: 6,
        name: 'Leaf 7',
        state: {
          expanded: false,
        },
        children: [
          {
            id: 7,
            name: 'Leaf 8',
          },
          {
            id: 8,
            name: 'Leaf 9',
          },
        ],
      },
      {
        id: 9,
        name: 'Leaf 10',
      },
    ],
  },
  {
    id: 'z',
    name: 'Leaf z',
    state: {
      deletable: true,
      favorite: true,
    },
  },
];
