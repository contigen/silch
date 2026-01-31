import { getPaymentStatus, verifyPaymentProof } from '@/actions'
import { StatusError, StatusView } from '@/components/status-view'

async function resolvePaymentStatus(intentId: string) {
  try {
    return { data: await getPaymentStatus(intentId), error: null }
  } catch {
    return {
      data: null,
      error: 'Failed to load payment status',
    }
  }
}

async function resolveProofData(intentId: string) {
  try {
    return await verifyPaymentProof(intentId)
  } catch {
    return null
  }
}

export default async function StatusPage({
  params,
}: PageProps<'/status/[id]'>) {
  const { id: intentId } = await params
  const [{ data, error }, proofData] = await Promise.all([
    resolvePaymentStatus(intentId),
    resolveProofData(intentId),
  ])

  if (error || !data) {
    return <StatusError error={error} />
  }
  return <StatusView status={data} proofData={proofData} />
}
