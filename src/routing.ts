import { useEffect, useState } from 'react';
import { routeLabels } from './data/demo';
import type { Route } from './data/demo';

export function readRoute(): Route {
  const value = window.location.hash.replace(/^#\/?/, '').split(/[?\/]/)[0];
  return Object.hasOwn(routeLabels, value) ? value as Route : 'overview';
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(readRoute);
  useEffect(() => {
    const onChange = () => { setRoute(readRoute()); window.scrollTo({ top: 0 }); };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
