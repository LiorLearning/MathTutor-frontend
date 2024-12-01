import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useMutation, useQueryClient } from 'react-query';
import { SuccessResponse } from '@/app/admin/summary/components/chat-summary';

interface PopupProps {
  setShowPopup: React.Dispatch<React.SetStateAction<boolean>>;
  username: string;
  sessionId: string;
}

const Popup: React.FC<PopupProps> = ({ setShowPopup, username, sessionId }) => {
  const queryClient = useQueryClient();
  const [ratingLearn, setRatingLearn] = useState(0);
  const [ratingFun, setRatingFun] = useState(0);
  const [ratingComments, setRatingComments] = useState('');
  const [isSaveEnabled, setIsSaveEnabled] = useState(false);

  useEffect(() => {
    setIsSaveEnabled(ratingLearn > 0 || ratingFun > 0 || ratingComments !== '');
  }, [ratingLearn, ratingFun, ratingComments]);

  const ratingsMutation = useMutation(
    async () => {
      const response = await axios.put<SuccessResponse>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/v1/session_summary/${username}/${sessionId}/ratings`,
        {
          rating_learn: ratingLearn,
          rating_fun: ratingFun,
          rating_comments: ratingComments
        }
      );
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData(['chatSummary', username, sessionId], data.updated_summary);
      },
      onError: (error) => {
        console.error('Error updating ratings:', error);
      }
    }
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="absolute inset-0 flex items-center justify-center bg-black/50 dark:bg-black/70 z-50"
      >
        <motion.div
          className="bg-card dark:bg-card p-8 rounded-lg shadow-lg w-full max-w-md"
          initial={{ y: -50 }}
          animate={{ y: 0 }}
        >
          <h2 className="text-2xl font-bold mb-4 text-foreground dark:text-foreground">Welcome to MathTutor</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <p className="font-semibold">Learning:</p>
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  className={`h-5 w-5 ${index < ratingLearn ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                  onClick={() => setRatingLearn(index + 1)}
                />
              ))}
            </div>
            <div className="flex items-center space-x-4">
              <p className="font-semibold">Fun:</p>
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  className={`h-5 w-5 ${index < ratingFun ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                  onClick={() => setRatingFun(index + 1)}
                />
              ))}
            </div>
            <div className="mt-4">
              <p className="font-semibold">Comments:</p>
              <Textarea 
                className="p-2 rounded-md" 
                value={ratingComments} 
                onChange={(e) => setRatingComments(e.target.value)} 
              />
            </div>
          </div>
          <Button 
            onClick={() => {
              ratingsMutation.mutate();
              setShowPopup(false);
            }} 
            className="w-full mt-4"
            disabled={!isSaveEnabled}
          >
            {ratingsMutation.isLoading ? 'Saving...' : 'Rate class'}
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Popup;