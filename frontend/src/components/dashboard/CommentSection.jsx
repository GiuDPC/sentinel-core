import { useState, useEffect, useRef } from 'react'
import { commentsApi } from '../../api/comments'
import { useAuth } from '../../Contexts/AuthContextObject'
import { MessageSquare, Send, Lock, Eye, Info } from 'lucide-react'
import notifications from '../ui/Notifications'

export default function CommentSection({ ticketId, userRole, initialComments = [] }) {
  const { user } = useAuth()
  const [comments, setComments] = useState(initialComments)
  const [prevInitialComments, setPrevInitialComments] = useState(initialComments)
  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const scrollContainerRef = useRef(null)

  if (initialComments !== prevInitialComments) {
    setComments(initialComments)
    setPrevInitialComments(initialComments)
  }

  const scrollToBottom = () => {
    if(scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }

  const ifFirstRender = useRef(true)
  useEffect(() => {
    if (ifFirstRender.current) {
      ifFirstRender.current = false
      return
    }
    scrollToBottom()
  }, [comments])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const content = newComment.trim()
    const internal = userRole === 'REQUESTER' ? false : isInternal
    
    const tempId = Date.now().toString()
    const optimisticComment = {
      id: tempId,
      content,
      isInternal: internal,
      createdAt: new Date().toISOString(),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName
      },
      isOptimistic: true // Bandera para estilo visual sutil
    }

    setComments(prev => [...prev, optimisticComment])
    setNewComment('')
    setSubmitting(true)

    try {
      const data = await commentsApi.create(ticketId, {
        content,
        isInternal: internal
      })
      
      setComments(prev => prev.map(c => c.id === tempId ? data : c))
    } catch (error) {
      setComments(prev => prev.filter(c => c.id !== tempId))
      notifications.error(error.message || 'Error al enviar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Formulario de envío con diseño Premium */}
      <form 
        onSubmit={handleSubmit} 
        className={`bg-white rounded-2xl p-4 border shadow-lg transition-all duration-500 transform ${
          isInternal && userRole !== 'REQUESTER' 
            ? 'border-amber-200 bg-amber-50/20 ring-4 ring-amber-500/5' 
            : 'border-slate-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/5'
        }`}
      >
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={isInternal && userRole !== 'REQUESTER' ? "Escribe una nota interna para el equipo..." : "Escribe un comentario para el locatario..."}
          className="w-full bg-transparent border-none text-sm text-slate-700 placeholder:text-slate-400 focus:ring-0 focus:outline-none outline-none resize-none min-h-[80px] transition-all"
          rows={2}
        />
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {userRole !== 'REQUESTER' && (
              <button
                type="button"
                onClick={() => setIsInternal(!isInternal)}
                className={`group flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 relative overflow-hidden ${
                  isInternal 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                }`}
                title={isInternal ? "Visible solo para Admins y Técnicos" : "Visible para el Locatario"}
              >
                <div className="absolute inset-0 bg-current opacity-0 group-hover:opacity-5 transition-opacity" />
                {isInternal ? <Lock size={14} className="animate-pulse" /> : <Eye size={14} />}
                <span className="text-[10px] font-black uppercase tracking-[0.1em]">
                  {isInternal ? 'Privado' : 'Público'}
                </span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-100 shadow-sm transition-all active:scale-95 group"
          >
            {submitting ? 'Enviando...' : (
              <>
                <span>Enviar</span>
                <Send size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform text-slate-400" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Lista de Mensajes */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar scroll-smooth">
        {comments.length === 0 ? (
          <div className="py-16 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 animate-in fade-in zoom-in duration-500">
            <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-4" />
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Sin actividad aún</p>
          </div>
        ) : (
          comments.map((comment, index) => (
            <div 
              key={comment.id} 
              className={`flex gap-4 p-5 rounded-2xl border transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 shadow-sm ${
                comment.isInternal 
                  ? 'bg-amber-50/40 border-amber-100 ring-1 ring-amber-200/50' 
                  : 'bg-white border-slate-100 hover:border-blue-100 hover:shadow-md'
              } ${comment.isOptimistic ? 'opacity-70 scale-[0.98]' : 'scale-100'}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 shadow-inner transform transition-transform hover:scale-110 ${
                comment.isInternal ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600'
              }`}>
                {comment.user?.firstName?.[0]}{comment.user?.lastName?.[0]}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-slate-900">
                      {comment.user?.firstName} {comment.user?.lastName}
                    </span>
                    {comment.isInternal && (
                      <span className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-lg flex items-center gap-1.5 border border-amber-200/50">
                        <Lock size={10} /> Privado
                      </span>
                    )}
                    {comment.userId === user.id && !comment.isInternal && (
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tú</span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                    {new Date(comment.createdAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <p className={`text-sm leading-relaxed break-words whitespace-pre-wrap font-medium ${
                  comment.isInternal ? 'text-amber-900/80' : 'text-slate-600'
                }`}>
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
       {/* <div ref={commentsEndRef} /> */}
      </div>
    </div>
  )
}
