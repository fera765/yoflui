import React, { createContext, useContext, useReducer } from 'react';

interface LikeState {
  likes: Record<string, boolean>;
  counts: Record<string, number>;
}

interface LikeAction {
  type: 'TOGGLE_LIKE';
  id: string;
  initialValue?: boolean;
  initialCount?: number;
}

interface LikeContextType {
  state: LikeState;
  toggleLike: (id: string, initialValue?: boolean, initialCount?: number) => void;
  isLiked: (id: string) => boolean;
  getCount: (id: string) => number;
}

const initialState: LikeState = {
  likes: {},
  counts: {}
};

const LikeContext = createContext<LikeContextType | undefined>(undefined);

const likeReducer = (state: LikeState, action: LikeAction): LikeState => {
  switch (action.type) {
    case 'TOGGLE_LIKE': {
      const { id, initialValue = false, initialCount = 0 } = action;
      const currentLiked = state.likes[id] ?? initialValue;
      const currentCount = state.counts[id] ?? initialCount;
      
      const newLiked = !currentLiked;
      const newCount = newLiked ? currentCount + 1 : currentCount - 1;
      
      return {
        likes: {
          ...state.likes,
          [id]: newLiked
        },
        counts: {
          ...state.counts,
          [id]: newCount
        }
      };
    }
    default:
      return state;
  }
};

export const LikeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(likeReducer, initialState);

  const toggleLike = (id: string, initialValue: boolean = false, initialCount: number = 0) => {
    dispatch({ type: 'TOGGLE_LIKE', id, initialValue, initialCount });
  };

  const isLiked = (id: string): boolean => {
    return state.likes[id] ?? false;
  };

  const getCount = (id: string): number => {
    return state.counts[id] ?? 0;
  };

  return (
    <LikeContext.Provider value={{ state, toggleLike, isLiked, getCount }}>
      {children}
    </LikeContext.Provider>
  );
};

export const useLike = (): LikeContextType => {
  const context = useContext(LikeContext);
  if (!context) {
    throw new Error('useLike must be used within a LikeProvider');
  }
  return context;
};