
import { MetricGroup } from './types';

export const BASE_METRICS: MetricGroup = [
  {
    key: 'AV',
    name: 'Attack Vector',
    options: [
      { key: 'N', name: 'Network', description: 'The vulnerability is bound to the network stack and the attacker\'s path is through OSI layer 3 (the network layer). Such a vulnerability is often termed "remotely exploitable" and can be thought of as a vulnerability that can be exploited one or more network hops away (e.g., across one or more routers).' },
      { key: 'A', name: 'Adjacent', description: 'The vulnerability is bound to the network stack, but the attack is limited at the protocol level to a logically adjacent topology. This can mean an attack must be launched from the same shared physical or logical network, or from within a secure or otherwise limited administrative domain.' },
      { key: 'L', name: 'Local', description: 'The vulnerable component is not bound to the network stack and the attacker\'s path is via read/write/execute capabilities. Either the attacker exploits the vulnerability by accessing the target system locally (e.g., keyboard, console), or through executing malicious code which they have loaded onto the target system.' },
      { key: 'P', name: 'Physical', description: 'The attack requires the attacker to physically touch or manipulate the vulnerable component. Physical interaction may be brief (e.g., an attack against a smart card by wirelessly charging it) or persistent. ' },
    ],
  },
  {
    key: 'AC',
    name: 'Attack Complexity',
    options: [
      { key: 'L', name: 'Low', description: 'Specialized access conditions or extenuating circumstances do not exist. An attacker can expect repeatable success when attacking the vulnerable component.' },
      { key: 'H', name: 'High', description: 'A successful attack depends on conditions beyond the attacker\'s control. That is, a successful attack cannot be accomplished at will, but requires the attacker to invest in some measurable amount of effort in preparation or execution against the vulnerable component before a successful attack can be expected.' },
    ],
  },
  {
    key: 'PR',
    name: 'Privileges Required',
    options: [
      { key: 'N', name: 'None', description: 'The attacker is unauthorized prior to attack, and therefore does not require any access to settings or files of the vulnerable system to carry out an attack.' },
      { key: 'L', name: 'Low', description: 'The attacker requires privileges that provide basic user capabilities that could normally affect only settings and files owned by a user. Alternatively, an attacker with Low privileges has the ability to access only non-sensitive resources.' },
      { key: 'H', name: 'High', description: 'The attacker requires privileges that provide significant (e.g., administrative) control over the vulnerable component allowing access to component-wide settings and files.' },
    ],
  },
  {
    key: 'UI',
    name: 'User Interaction',
    options: [
      { key: 'N', name: 'None', description: 'The vulnerable system can be exploited without interaction from any user.' },
      { key: 'R', name: 'Required', description: 'Successful exploitation of this vulnerability requires a user to take some action before the vulnerability can be exploited. For example, a successful exploit may only be possible during the installation of an application by a system administrator.' },
    ],
  },
  {
    key: 'S',
    name: 'Scope',
    options: [
      { key: 'U', name: 'Unchanged', description: 'An exploited vulnerability can only affect resources managed by the same security authority. In this case, the vulnerable component and the impacted component are the same.' },
      { key: 'C', name: 'Changed', description: 'An exploited vulnerability can affect resources beyond the security scope managed by the security authority of the vulnerable component. In this case, the vulnerable component and the impacted component are different.' },
    ],
  },
  {
    key: 'C',
    name: 'Confidentiality',
    options: [
      { key: 'N', name: 'None', description: 'There is no loss of confidentiality within the impacted component.' },
      { key: 'L', name: 'Low', description: 'There is some loss of confidentiality. Access to some restricted information is obtained, but the attacker does not have control over what information is obtained, or the amount or kind of loss is limited. ' },
      { key: 'H', name: 'High', description: 'There is a total loss of confidentiality, resulting in all resources within the impacted component being divulged to the attacker. Alternatively, access to only some restricted information is obtained, but the disclosed information presents a direct, serious impact. ' },
    ],
  },
  {
    key: 'I',
    name: 'Integrity',
    options: [
      { key: 'N', name: 'None', description: 'There is no loss of integrity within the impacted component.' },
      { key: 'L', name: 'Low', description: 'Modification of data is possible, but the attacker does not have control over the consequence of a modification, or the amount of modification is limited. ' },
      { key: 'H', name: 'High', description: 'There is a total loss of integrity, or a complete loss of protection. For example, the attacker is able to modify any/all files protected by the impacted component. ' },
    ],
  },
  {
    key: 'A',
    name: 'Availability',
    options: [
      { key: 'N', name: 'None', description: 'There is no impact to availability within the impacted component.' },
      { key: 'L', name: 'Low', description: 'There is reduced performance or interruptions in resource availability. Even if repeated exploitation of the vulnerability is possible, the attacker does not have the ability to completely deny service to legitimate users.' },
      { key: 'H', name: 'High', description: 'There is a total loss of availability, resulting in the attacker being able to fully deny access to resources in the impacted component; this loss is either sustained (while the attacker continues to deliver the attack) or persistent (the condition persists even after the attack has completed).' },
    ],
  },
];

export const TEMPORAL_METRICS: MetricGroup = [
  {
    key: 'E',
    name: 'Exploit Code Maturity',
    options: [
      { key: 'X', name: 'N/A', description: 'Assigning this value to the metric will not influence the score. It is a signal to consumers of CVSS information that however the vulnerability is exploited, it is not specified here.' },
      { key: 'U', name: 'Unproven', description: 'No exploit code is available, or an exploit is theoretical.' },
      { key: 'P', name: 'PoC', description: 'Proof-of-concept exploit code is available, or an attack demonstration is not practical for most systems. The code or technique is not reliable or is difficult to use.' },
      { key: 'F', name: 'Functional', description: 'Functional exploit code is available. The code works in most situations where the vulnerability exists.' },
      { key: 'H', name: 'High', description: 'Functional autonomous code exists, or no exploit is required (e.g., trivial Denial of Service). The code works in every situation, or is actively being delivered via an autonomous agent (such as a worm or virus).' },
    ],
  },
  {
    key: 'RL',
    name: 'Remediation Level',
    options: [
        { key: 'X', name: 'N/A', description: 'Assigning this value to the metric will not influence the score. It is a signal to consumers of CVSS information that the remediation level is not specified.' },
        { key: 'O', name: 'Official Fix', description: 'A complete vendor solution is available. Either the vendor has issued an official patch, or an upgrade is available.' },
        { key: 'T', name: 'Temp Fix', description: 'There is an official but temporary fix available. This includes instances where the vendor issues a temporary hotfix, tool, or document describing how to alleviate the vulnerability.' },
        { key: 'W', name: 'Workaround', description: 'There is an unofficial, non-vendor solution available. In some cases, users of the affected technology will create a patch of their own or provide steps to work around or otherwise mitigate the vulnerability.' },
        { key: 'U', name: 'Unavailable', description: 'There is no solution available or it is impossible to apply.' },
    ],
  },
  {
    key: 'RC',
    name: 'Report Confidence',
    options: [
      { key: 'X', name: 'N/A', description: 'Assigning this value to the metric will not influence the score. It is a signal to consumers of CVSS information that the report confidence is not specified.' },
      { key: 'C', name: 'Confirmed', description: 'Detailed reports exist, or functional reproduction is possible (functional exploits may provide this). Source code is available to independently verify the assertions of the research, or the author or vendor of the affected code has confirmed the presence of the vulnerability.' },
      { key: 'R', name: 'Reasonable', description: 'Significant details are published, but researchers may differ on the exact nature of the vulnerability, severity, and potential impact. The report is reasonable, but not yet confirmed by the vendor or the original researcher.' },
      { key: 'U', name: 'Unknown', description: 'There are reports of impacts that indicate a vulnerability is present. The reports indicate that the cause of the vulnerability is unknown, or reports may differ greatly on the cause or impacts of the vulnerability. Initial reports of a vulnerability may be Unknown.' },
    ],
  },
];

export const ENVIRONMENTAL_METRICS: MetricGroup = [
    {
    key: 'CR',
    name: 'Confidentiality Requirement',
    options: [
        { key: 'X', name: 'N/A', description: 'Assigning this value to the metric will not influence the score. It is a signal to consumers of CVSS information that this environmental metric is not specified.' },
        { key: 'L', name: 'Low', description: 'Loss of confidentiality is likely to have only a limited adverse effect on the organization or individuals associated with the organization.' },
        { key: 'M', name: 'Medium', description: 'Loss of confidentiality is likely to have a serious adverse effect on the organization or individuals associated with the organization.' },
        { key: 'H', name: 'High', description: 'Loss of confidentiality is likely to have a catastrophic adverse effect on the organization or individuals associated with the organization (e.g., employees, customers).' },
    ],
  },
  {
    key: 'IR',
    name: 'Integrity Requirement',
    options: [
        { key: 'X', name: 'N/A', description: 'Assigning this value to the metric will not influence the score. It is a signal to consumers of CVSS information that this environmental metric is not specified.' },
        { key: 'L', name: 'Low', description: 'Loss of integrity is likely to have only a limited adverse effect on the organization or individuals associated with the organization.' },
        { key: 'M', name: 'Medium', description: 'Loss of integrity is likely to have a serious adverse effect on the organization or individuals associated with the organization.' },
        { key: 'H', name: 'High', description: 'Loss of integrity is likely to have a catastrophic adverse effect on the organization or individuals associated with the organization.' },
    ],
  },
  {
    key: 'AR',
    name: 'Availability Requirement',
    options: [
        { key: 'X', name: 'N/A', description: 'Assigning this value to the metric will not influence the score. It is a signal to consumers of CVSS information that this environmental metric is not specified.' },
        { key: 'L', name: 'Low', description: 'Loss of availability is likely to have only a limited adverse effect on the organization or individuals associated with the organization.' },
        { key: 'M', name: 'Medium', description: 'Loss of availability is likely to have a serious adverse effect on the organization or individuals associated with the organization.' },
        { key: 'H', name: 'High', description: 'Loss of availability is likely to have a catastrophic adverse effect on the organization or individuals associated with the organization.' },
    ],
  },
];
