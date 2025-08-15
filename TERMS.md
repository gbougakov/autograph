# Autograph - Terms of Use and Critical Warnings

*This document is also available in [Dutch](TERMS_NL.md) and [French](TERMS_FR.md) for your convenience. However, the English version is the legally binding and enforceable text. In case of any discrepancies between translations, the English version prevails.*

## What This Software Does

Autograph is a macOS application that enables you to digitally sign documents using your Belgian eID card. These signatures are created using the 'Signature' certificate on your eID (not the 'Authentication' certificate), which means they are **non-repudiable** and **legally binding**.

## Critical Legal Warning

**This is not a toy or a convenience tool - this software creates real, legally enforceable signatures.**

Digital signatures created with your Belgian eID are legally equivalent to handwritten signatures under Belgian and EU law (eIDAS Regulation EU No 910/2014, Belgian Law of 21 July 2016, and Belgian Law of 9 July 2001). They are valid and binding wherever electronic signatures are accepted.

When you sign a document using Autograph, you are creating the same legal commitment as if you had signed it with a pen. This means:
- You can be held legally responsible for any document you sign
- You should never sign anything you haven't read and understood
- You should never sign anything you don't agree to
- You should never allow untrusted software to access your Signature certificate

**The authors of Autograph bear absolutely no responsibility for what you choose to sign. You are entirely responsible for your own digital signatures.**

## Privacy Considerations

Your Belgian eID signature certificate contains your **National Registry Number** (Rijksregisternummer / Numéro de Registre National) embedded in its metadata. This number will be visible to anyone who receives a document you've digitally signed - they can extract it from the signature data.

While your National Registry Number isn't secret (it appears on various official documents), it is considered sensitive personal information under GDPR. Once you sign a document, you cannot control who might extract this number from your signature. Think carefully before:
- Sending signed documents to people or organizations you don't trust
- Uploading signed documents to public websites
- Sharing signed documents on social media or forums
- Forwarding documents that contain eID signatures (yours or someone else's)

## Good Faith Statement

While this software comes with no guarantees, the authors are committed to:
- Making good faith efforts to address security vulnerabilities when we become aware of them
- Following security best practices to the best of our knowledge and ability
- Keeping the software open source so the community can review and improve it
- Protecting your personal information
- Accepting bug reports and security disclosures in good faith
- Being transparent about known limitations and issues

However, despite these good faith efforts:
- We are not security professionals
- This software has not undergone professional security auditing
- We cannot guarantee that our efforts are sufficient or that the software is secure
- We are volunteers providing free software without any compensation
- Our ability to respond to issues depends on our available time and expertise

You are encouraged to review the source code, report issues, and contribute improvements. However, the existence of an issue tracker or our responsiveness to issues does not create any obligation or warranty.

## Disclaimer of All Warranties and Liability

**THIS SOFTWARE IS PROVIDED WITHOUT ANY GUARANTEES WHATSOEVER.**

The authors provide this software "as is" and explicitly disclaim all liability for absolutely everything, including but not limited to:

- Documents you sign (whether intentionally or by mistake)
- Legal consequences of your digital signatures
- Document corruption, data loss, or file damage
- Security vulnerabilities (known or unknown, present or future)
- Exposure of your personal data or that of others
- Failure of signatures to be created, validated, or accepted
- Incompatibility with any systems or software
- Any direct, indirect, incidental, special, or consequential damages
- Loss of money, time, data, reputation, or anything else of value
- Compliance with any legal, regulatory, or technical requirements
- Anything else that could possibly go wrong

**UNDER NO CIRCUMSTANCES WILL THE AUTHORS BE LIABLE FOR ANYTHING.**

This software interacts with cryptographic hardware and legally binding signature mechanisms. It might have bugs. It might have security vulnerabilities. It might corrupt your files. It might create invalid signatures. It might expose your personal data. We make no promises that it works correctly or safely.

If you use this software, you do so entirely at your own risk. You agree to take full responsibility for any consequences and to never hold the authors liable for anything. If you're not comfortable with this level of risk and responsibility, do not use this software.

## Your Acknowledgment

By downloading, installing, or using Autograph, you confirm that:
1. You understand that this software creates legally binding signatures
2. You accept complete responsibility for any documents you sign
3. You understand the privacy implications regarding your National Registry Number
4. You accept that the software comes with absolutely no guarantees
5. You understand that while the authors make good faith efforts to maintain security, this does not constitute any warranty or guarantee
6. You will never hold the authors liable for anything
7. You are using this software entirely at your own risk

If you do not understand or accept any of these terms, do not use Autograph.

---

*Last Updated: August 15th, 2025*