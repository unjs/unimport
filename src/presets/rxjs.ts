import { defineUnimportPreset } from '../utils'

export default defineUnimportPreset({
  from: 'rxjs',
  imports: [
    'of',
    'from',
    'map',
    'tap',
    'filter',
    'forkJoin',
    'throwError',
    'catchError',
    'Observable',
    'mergeMap',
    'switchMap',
    'merge',
    'zip',
    'take',
    'takeUntil',
    'first',
    'lastValueFrom',
    'skip',
    'skipUntil',
    'distinct',
    'distinctUntilChanged',
    'throttle',
    'throttleTime',
    'retry',
    'retryWhen',
    'timeout',
    'delay',
    'debounce',
    'debounceTime',
    'find',
    'every'
  ]
})
