import { useEid, UseEidReturn } from '@/hooks/useEid';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';

export default function ConnectionStatusIndicator({eid}: { eid: UseEidReturn }) {
  

  if (eid.isLoading) {
    return (<motion.div layout className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full bg-gray-500" />
      <span className="text-sm text-gray-700 text-gray-500">Loading</span>
    </motion.div>);
  }

  if (eid.isConnected && !eid.hasCard) {
    return (<motion.div layout className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
      <span className="text-sm text-gray-700 text-red-500">No card inserted</span>
    </motion.div>);
  }

  if (!eid.isConnected) {
    return (<motion.div layout className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
      <span className="text-sm text-gray-700 text-red-500">Card reader disconnected</span>
    </motion.div>);
  }

  if (eid.isConnected && eid.hasCard && eid.cardData?.documentType !== null) {
    return (<motion.div layout className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
      <span className="text-sm text-gray-700 text-green-500">Connected</span>
    </motion.div>);
  }

  return (
    <motion.div layout className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full bg-gray-500" />
      <span className="text-sm text-gray-700 text-gray-500">Status unknown</span>
    </motion.div>
  );
}
