import {
  canShowAuthorityContact,
  currentFees,
  easternDateKey,
  formatDate,
  formatMoney,
  verificationLabels,
  verifiedApplicationUrl,
  yesNo,
  type PermitDetail,
} from "@cric-atlas/domain";
import { ExternalLink } from "lucide-react";
import { Facts, Panel, SourceList } from "@/components/detail-ui";
import { loadGround } from "@/lib/grounds";

export const revalidate = 60;

function Apply({ permit }: { permit: PermitDetail }) {
  const url = verifiedApplicationUrl(permit);
  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-action-600 px-5 font-semibold text-white hover:bg-blue-800 sm:w-auto">
        Apply for Permit <ExternalLink aria-hidden className="size-4" />
      </a>
    );
  }
  return (
    <p className="rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-950">
      The application link is not yet verified. Please contact the permit authority before applying.
    </p>
  );
}

function Contact({ permit }: { permit: PermitDetail }) {
  const authority = permit.authority;
  if (!canShowAuthorityContact(authority)) return <p className="text-slate-600 italic">Contact details not yet verified.</p>;
  return (
    <>
      {authority.is_sample && <p className="mb-3 text-sm font-semibold text-amber-900">Sample contact. Do not use.</p>}
      <Facts items={[
        { label: "Authority", value: authority.authority_name },
        { label: "Contact", value: authority.contact_name },
        { label: "Phone", value: authority.phone },
        { label: "Email", value: authority.email },
        { label: "Instructions", value: authority.application_instructions },
      ]} />
    </>
  );
}

export default async function GroundPermitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ground = await loadGround(slug);
  const todayKey = easternDateKey(new Date());

  if (ground.permits.length === 0) {
    return (
      <Panel title="Permit Details">
        <p className="text-slate-700">Permit information is not yet verified. Please contact {ground.municipality} before using this ground.</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-8">
      {ground.permits.map((permit) => {
        const fees = currentFees(permit.fees, todayKey);
        return (
          <div key={permit.id} className="grid gap-5 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-5">
              <Panel title={permit.permit_type ?? "Permit Details"}>
                <div className="mb-5"><Apply permit={permit} /></div>
                <Facts items={[
                  { label: "Permit required", value: yesNo(permit.permit_required) },
                  { label: "Permit authority", value: permit.authority?.authority_name ?? null },
                  { label: "Application method", value: permit.application_method },
                  { label: "Advance notice", value: permit.advance_notice_days === null ? null : `${permit.advance_notice_days} days` },
                  { label: "Booking duration", value: permit.booking_duration_hours === null ? null : `${Number(permit.booking_duration_hours)} hours` },
                  { label: "Insurance required", value: yesNo(permit.insurance_required) },
                  { label: "Roster required", value: yesNo(permit.roster_required) },
                  { label: "Special-event rules", value: permit.special_event_rules },
                ]} />
              </Panel>
              <Panel title="Fees">
                {fees.length === 0 ? <p className="text-slate-600 italic">Fees not yet verified.</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead><tr className="border-b border-slate-200 text-slate-600"><th scope="col" className="py-2 pr-4 font-medium">Applicant</th><th scope="col" className="py-2 pr-4 font-medium">Duration</th><th scope="col" className="py-2 text-right font-medium">Amount</th></tr></thead>
                      <tbody>
                        {fees.map((fee) => (
                          <tr key={fee.id} className="border-b border-slate-100 last:border-0">
                            <td className="py-2.5 pr-4 font-semibold">{fee.applicant_category}</td>
                            <td className="py-2.5 pr-4">{fee.duration_hours === null ? "Not yet verified" : `${Number(fee.duration_hours)} hours`}</td>
                            <td className="py-2.5 text-right font-bold">{formatMoney(fee.amount, fee.currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>
            </div>
            <div className="space-y-5">
              <Panel title="Authority Contact"><Contact permit={permit} /></Panel>
              <Panel title="Official Sources">
                <SourceList sources={permit.sources} />
                <p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
                  {verificationLabels[permit.verification_status]}{permit.last_verified_at ? `, ${formatDate(permit.last_verified_at)}` : ""}
                </p>
              </Panel>
            </div>
          </div>
        );
      })}
    </div>
  );
}
