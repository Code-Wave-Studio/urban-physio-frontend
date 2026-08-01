import { Navigate, useLocation } from 'react-router-dom';
import PolicyPageLayout from '../../components/PolicyPageLayout';
import { getPolicyByPath } from '../../constants/policyPages';
import ManagedPageSeo from '../../components/seo/ManagedPageSeo';

export default function PolicyPage() {
  const { pathname } = useLocation();
  const policy = getPolicyByPath(pathname);

  if (!policy) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <ManagedPageSeo
        fallbackTitle={policy.title}
        fallbackDescription={policy.subtitle}
        pathOverride={policy.path}
        canonical={policy.path}
      />
      <PolicyPageLayout policy={policy} />
    </>
  );
}
