import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api.js";

// Custom hook: GET a URL and give back { data, loading, error, reload }.
// Used by the listing page and by each of the three feature cards.
export default function useFetch(url, params) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0); // changing this re-runs the effect (see reload)

  const paramsKey = JSON.stringify(params || {});

  useEffect(() => {
    let ignore = false; // if the component changes before the reply arrives, drop the old reply
    setLoading(true);
    setError("");

    api
      .get(url, { params })
      .then((res) => !ignore && setData(res.data))
      .catch((err) => !ignore && setError(getErrorMessage(err)))
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, paramsKey, tick]);

  return { data, loading, error, reload: () => setTick((t) => t + 1) };
}
