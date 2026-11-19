import type { FilterState } from '@/domain/filters';
import type { FilterPatch } from '@/state/url-state';

/** Every filter control reads domain state and emits a URL patch (the view resets the page). */
export interface FilterControlProps {
  filters: FilterState;
  onChange: (patch: FilterPatch) => void;
}
