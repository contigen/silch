export default function Loading() {
  return (
    <div className='grid place-items-center h-dvh'>
      <div className='relative'>
        <div className='absolute inset-0 size-16 rounded-full border-2 animate-spin border-gold/30 border-t-primary' />
      </div>
    </div>
  )
}
