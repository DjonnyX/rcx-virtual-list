import React, { useEffect, useState } from 'react';

export const useInitialize = () => {
    const [_initialized, _setInitialized] = useState<boolean>(false);

    useEffect(() => {
        _setInitialized(true);
    }, []);

    return {
        _initialized,
    };
};
