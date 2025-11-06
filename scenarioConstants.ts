import { ThreatType, ThreatCommunity, Target, Impact } from './types';

interface Option<T> {
    value: T;
    label: string;
}

export const SCENARIO_OPTIONS: {
    threatTypes: Option<ThreatType>[];
    threatCommunities: Option<ThreatCommunity>[];
    targets: Option<Target>[];
    impacts: Option<Impact>[];
} = {
    threatTypes: [
        { value: 'Adversarial', label: 'Adversarial' },
        { value: 'Accidental', label: 'Accidental' },
        { value: 'Environmental', label: 'Environmental' },
    ],
    threatCommunities: [
        { value: 'External', label: 'External' },
        { value: 'Internal', label: 'Internal' },
        { value: 'N/A', label: 'N/A' },
    ],
    targets: [
        { value: 'Firm', label: 'Firm' },
        { value: 'Client', label: 'Client' },
        { value: 'Third Party', label: 'Third Party' },
    ],
    impacts: [
        { value: 'Confidentiality', label: 'Confidentiality' },
        { value: 'Integrity', label: 'Integrity' },
        { value: 'Availability', label: 'Availability' },
    ],
};