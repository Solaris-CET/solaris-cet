import { render } from '@testing-library/react';
import { describe, expect,it } from 'vitest';

import { BuildSeal } from '../components/BuildSeal';
import { HeaderTrustStrip } from '../components/HeaderTrustStrip';
import TeamFlipCard from '../components/TeamFlipCard';

describe('Static cards snapshots', () => {
  it('BuildSeal snapshot', () => {
    const { asFragment } = render(<BuildSeal />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('HeaderTrustStrip snapshot', () => {
    const { asFragment } = render(<HeaderTrustStrip align="end" />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('TeamFlipCard snapshot', () => {
    const { asFragment } = render(
      <TeamFlipCard
        initials="SC"
        role="Security"
        name="Solaris CET"
        bio="Short bio."
        linkedinUrl="https://example.com/linkedin"
        xUrl="https://example.com/x"
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });
});

