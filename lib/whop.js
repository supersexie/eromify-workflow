const WHOP_API = "https://api.whop.com/api/v5";
const API_KEY = process.env.WHOP_API_KEY;

const PLAN_TIERS = {
  builder: 0,
  launch: 1,
  growth: 2,
  creator: 3,
};

async function whopFetch(path, opts = {}) {
  const res = await fetch(`${WHOP_API}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...opts.headers,
    },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getMembershipByEmail(email) {
  const data = await whopFetch(
    `/company/memberships?email=${encodeURIComponent(email)}&per_page=10`
  );
  if (!data?.data?.length) return null;

  const active = data.data.find(
    (m) => m.status === "active" || m.status === "trialing"
  );
  if (!active) return null;

  const productName = (active.product?.name || "").toLowerCase();
  let tier = "builder";
  for (const key of Object.keys(PLAN_TIERS)) {
    if (productName.includes(key)) {
      tier = key;
      break;
    }
  }

  return {
    id: active.id,
    tier,
    tierIndex: PLAN_TIERS[tier] ?? 0,
    status: active.status,
    productId: active.product?.id,
    productName: active.product?.name,
    expiresAt: active.renewal_period_end,
  };
}

export async function validateMembership(membershipId) {
  const data = await whopFetch(`/company/memberships/${membershipId}`);
  if (!data) return false;
  return data.status === "active" || data.status === "trialing";
}

export { PLAN_TIERS };
