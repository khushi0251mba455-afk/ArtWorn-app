import React, { useEffect, useRef, useState } from 'react';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { ImagePlus, Loader2, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db, handleFirestoreError, OperationType, uploadImageToStorage, validateImageFile } from '../lib/firebase';
import type { CustomMessage, UserRole } from '../types';

interface CustomRequestChatProps {
  requestId: string;
  requestOwnerUid: string;
  senderRole: UserRole;
}

export const CustomRequestChat: React.FC<CustomRequestChatProps> = ({
  requestId,
  requestOwnerUid,
  senderRole,
}) => {
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<CustomMessage[]>([]);
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !requestId) return;
    const msgQuery = query(
      collection(db, 'customRequests', requestId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(
      msgQuery,
      (snap) => {
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CustomMessage)));
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `customRequests/${requestId}/messages`);
      }
    );
    return () => unsub();
  }, [user, requestId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!text.trim() && !imageFile) return;

    setSending(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const err = validateImageFile(imageFile);
        if (err) throw new Error(err);
        imageUrl = await uploadImageToStorage(imageFile, 'custom-requests', requestOwnerUid);
      }

      await addDoc(collection(db, 'customRequests', requestId, 'messages'), {
        senderId: user.uid,
        senderName:
          senderRole === 'admin'
            ? 'ArtWorn Studio'
            : (profile?.displayName || user.displayName || 'Customer').slice(0, 100),
        senderRole,
        ...(text.trim() ? { text: text.trim().slice(0, 1500) } : {}),
        ...(imageUrl ? { imageUrl } : {}),
        createdAt: serverTimestamp(),
      });

      setText('');
      setImageFile(null);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Image')) {
        showToast(error.message, 'error');
      } else {
        handleFirestoreError(error, OperationType.CREATE, `customRequests/${requestId}/messages`);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#E6DDD0] dark:border-[#332D27] bg-[#FAF6F0] dark:bg-[#141210] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[#E6DDD0] dark:border-[#332D27] bg-[#F3ECE2]/70 dark:bg-[#1E1B18] text-xs font-semibold">
        Studio Chat Thread
      </div>

      <div className="max-h-64 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-xs text-[#5C554E] dark:text-[#B5ADA4] text-center py-4">
            No messages yet. Send a note or sketch update!
          </p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === user?.uid;
            return (
              <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-[#5C554E] dark:text-[#B5ADA4] mb-1">
                  {msg.senderName}
                </span>
                <div
                  className={`max-w-[82%] rounded-xl px-3.5 py-2 text-xs leading-relaxed ${
                    isMine
                      ? 'bg-[#C65D3B] text-white'
                      : 'bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#332D27]'
                  }`}
                >
                  {msg.text && <p>{msg.text}</p>}
                  {msg.imageUrl && (
                    <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer" className="block mt-2">
                      <img
                        src={msg.imageUrl}
                        alt="Chat attachment"
                        className="max-h-40 rounded-lg object-cover"
                      />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="p-2.5 border-t border-[#E6DDD0] dark:border-[#332D27] bg-white dark:bg-[#1E1B18] flex items-center gap-2"
      >
        <label
          title="Attach image (max 5MB)"
          className="p-2 rounded-lg hover:bg-[#F3ECE2] dark:hover:bg-[#25211D] cursor-pointer text-[#5C554E] dark:text-[#B5ADA4]"
        >
          <ImagePlus className="w-4 h-4 text-[#C65D3B]" />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
        </label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={imageFile ? `Attached: ${imageFile.name}` : 'Message studio artist...'}
          className="flex-1 px-3 py-2 rounded-lg bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-xs focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending}
          aria-label="Send message"
          className="p-2 rounded-lg bg-[#C65D3B] text-white hover:bg-[#B24F30] disabled:opacity-60"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};
