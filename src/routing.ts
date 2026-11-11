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

export function usePolicyId() {
  const read = () => window.location.hash.replace(/^#\/?/, '').split('/')[1] ?? '';
  const [id, setId] = useState(read);
  useEffect(() => {
    const update = () => setId(read());
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return id;
}

export function useClubLocation() {
  const read = () => {
    const parts = window.location.hash.replace(/^#\/?/, '').split('/');
    return { section: parts[1] || 'events', id: parts[2] || '' };
  };
  const [location, setLocation] = useState(read);
  useEffect(() => {
    const update = () => setLocation(read());
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return location;
}

export function useServiceLocation() {
  const read = () => {
    const parts = window.location.hash.replace(/^#\/?/, '').split('/');
    return { section: parts[1] || 'home', id: parts[2] || '' };
  };
  const [location, setLocation] = useState(read);
  useEffect(() => {
    const update = () => setLocation(read());
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return location;
}
