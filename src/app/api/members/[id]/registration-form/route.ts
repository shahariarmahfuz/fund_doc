import { NextResponse } from "next/server";
import { getMember } from "@/features/members/actions";
import { getBrandingSettings } from "@/lib/branding";

function translateStatus(status: string) {
  switch (status) {
    case "ACTIVE": return "Active";
    case "INACTIVE": return "Inactive";
    case "DELETED": return "Deleted";
    default: return status;
  }
}

function formatDateEnglish(date: Date | null | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(date));
}

function escapeHtml(unsafe: string | null | undefined) {
  if (!unsafe) return "";
  return unsafe
       .replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/"/g, "&quot;")
       .replace(/'/g, "&#039;");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const [member, branding] = await Promise.all([
    getMember(resolvedParams.id),
    getBrandingSettings(),
  ]);

  if (!member) {
    return new NextResponse("Member not found", { status: 404 });
  }

  const positionMap: Record<string, string> = {
    PRESIDENT: "President",
    VICE_PRESIDENT: "Vice President",
    GENERAL_SECRETARY: "General Secretary",
    JOINT_SECRETARY: "Joint Secretary",
    ORGANIZING_SECRETARY: "Organizing Secretary",
    TREASURER: "Treasurer",
    ADVISOR: "Advisor",
    EXECUTIVE_MEMBER: "Executive Member",
    GENERAL_MEMBER: "General Member"
  };
  const positionLabel = member.position ? (positionMap[member.position] || member.position) : "General Member";

  const getDoc = (title: string) => member.documents?.find((d: any) => d.title === title)?.secureUrl;
  const photoUrl = getDoc("Member Photo") || getDoc("Photo");

  let reference = { name: "", mobile: "", relation: "" };
  try {
    if (member.reference) reference = JSON.parse(member.reference);
  } catch(e) {}

  const photoBoxContent = photoUrl 
    ? `<div style="width: 90px; height: 110px;"><img src="${photoUrl}" alt="Member Photo" style="width:100%;height:100%;object-fit:cover;border-radius:4px;" /></div>` 
    : `<div class="photo-box">Member<br>Photo</div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Member Profile & Registration Form</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">

<style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', Arial, sans-serif; }
    body { background: #f3f4f6; padding: 20px; color: #1f2937; line-height: 1.4; }
    
    .paper {
        width: 210mm;
        min-height: 297mm;
        background: #fff;
        margin: 0 auto;
        padding: 10mm 15mm;
        box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        overflow: hidden;
    }

    .print-btn { text-align: center; margin-bottom: 15px; }
    .print-btn button {
        background: #0f766e; color: #fff; border: none; padding: 10px 25px;
        border-radius: 6px; cursor: pointer; font-size: 15px; font-weight: 600;
    }
    .print-btn button:hover { background: #115e59; }

    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f766e; padding-bottom: 10px; margin-bottom: 12px; }
    .logo { width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; }
    .logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .title { flex: 1; text-align: center; padding: 0 15px; }
    .title h1 { font-size: 24px; color: #0f766e; font-weight: 700; margin-bottom: 2px; }
    .title h2 { font-size: 14px; color: #4b5563; font-weight: 600; margin-bottom: 4px; }
    .title p { font-size: 13px; color: #374151; }
    .slogan { font-size: 14px; font-weight: 600; color: #b45309; margin-top: 4px; font-style: italic; }
    .photo-box { width: 90px; height: 110px; border: 2px dashed #d1d5db; display: flex; justify-content: center; align-items: center; font-size: 12px; color: #6b7280; text-align: center; background: #f9fafb; border-radius: 4px; }

    .section-title {
        font-size: 15px;
        font-weight: 700;
        color: #0f766e;
        border-bottom: 1.5px solid #0f766e;
        padding-bottom: 4px;
        margin: 12px 0 6px;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .section-title::before {
        content: '';
        display: inline-block;
        width: 6px;
        height: 6px;
        background: #0f766e;
        border-radius: 50%;
    }

    .data-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 6px 30px;
    }
    .data-grid.full-width {
        grid-template-columns: 1fr;
    }
    .data-item {
        display: flex;
        align-items: baseline;
        gap: 6px;
        padding: 3px 0;
    }
    .data-label {
        font-size: 13px;
        color: #374151;
        font-weight: 600;
        white-space: nowrap;
        min-width: fit-content;
    }
    .data-value {
        font-size: 13px;
        color: #111827;
        font-weight: 500;
        flex: 1;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .data-item.full {
        grid-column: 1 / -1;
    }

    .declaration-box {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-left: 4px solid #0f766e;
        padding: 10px 15px;
        margin-top: 10px;
        border-radius: 4px;
    }
    .declaration-text {
        font-size: 13px;
        color: #374151;
        line-height: 1.6;
        text-align: justify;
    }

    .footer {
        margin-top: 15px;
        text-align: center;
        color: #9ca3af;
        font-size: 11px;
        border-top: 1px solid #e5e7eb;
        padding-top: 8px;
    }

    @media print {
        @page { 
            size: A4; 
            margin: 10mm 15mm; 
        }
        
        body { 
            background: #fff; 
            padding: 0; 
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .print-btn { 
            display: none !important; 
        }
        
        .paper { 
            width: 100% !important; 
            height: auto !important; 
            min-height: auto !important;
            box-shadow: none !important; 
            padding: 0 !important; 
            margin: 0 !important;
        }

        .data-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 7px 30px !important;
        }
        
        .data-item {
            padding: 4px 0 !important;
        }

        .section-title {
            margin-top: 18px !important;
            margin-bottom: 11px !important;
        }

        .declaration-box {
            padding: 11px 15px !important;
            margin-top: 13px !important;
        }

        .footer {
            margin-top: 21px !important;
            padding-top: 9px !important;
        }

        .header {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding-bottom: 12px !important;
            margin-bottom: 14px !important;
        }

        .header,
        .section-title,
        .data-grid,
        .declaration-box,
        .footer {
            break-inside: avoid;
            page-break-inside: avoid;
        }

        .data-item {
            break-inside: avoid;
            page-break-inside: avoid;
        }

        .section-title { 
            color: #0f766e !important; 
            border-color: #0f766e !important;
        }
        
        .data-value { 
            border-bottom: 1px solid #e5e7eb !important;
        }
        
        .declaration-box { 
            background: #f9fafb !important; 
            border-left: 4px solid #0f766e !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .data-label {
            font-size: 13px !important;
            white-space: nowrap !important;
        }

        .data-value {
            font-size: 13px !important;
            white-space: nowrap !important;
        }

        .title h1 { font-size: 24px !important; }
        .title h2 { font-size: 14px !important; }
        .title p { font-size: 13px !important; }
        .slogan { font-size: 14px !important; }
        .section-title { font-size: 15px !important; }
        .declaration-text { font-size: 13px !important; }
    }
</style>

</head>
<body>

<div class="print-btn">
    <button onclick="window.print()">🖨 Print Form (A4)</button>
</div>

<div class="paper">

    <div class="header">
        <div class="logo">
            <img src="${escapeHtml(branding.logoUrl || "https://res.cloudinary.com/diwp8ug1r/image/upload/v1785393014/branding/o4r9o3gjgfkulrgm4bzu.png?v=1785394871157")}" alt="${escapeHtml(branding.foundationName)} Logo">
        </div>
        <div class="title">
            <h1>${escapeHtml(branding.foundationName)}</h1>
            <h2><strong>Non-Profit Welfare Organization</strong></h2>
            <p><strong>Sonargaon, Narayanganj, Bangladesh</strong></p>
            <p><strong>Contact:</strong> +880 1963953682, +880 1834006014</p>
            <p class="slogan">"In service of humanity"</p>
        </div>
        ${photoBoxContent}
    </div>

    <div class="section-title">Personal Information</div>
    <div class="data-grid">
        <div class="data-item">
            <span class="data-label">1. Full Name:</span>
            <span class="data-value">${escapeHtml(member.fullName)}</span>
        </div>
        <div class="data-item">
            <span class="data-label">2. Father's Name:</span>
            <span class="data-value">${escapeHtml(member.fatherName)}</span>
        </div>
        <div class="data-item">
            <span class="data-label">3. Mother's Name:</span>
            <span class="data-value">${escapeHtml(member.motherName)}</span>
        </div>
        <div class="data-item">
            <span class="data-label">4. Date of Birth:</span>
            <span class="data-value">${escapeHtml(formatDateEnglish(member.dob))}</span>
        </div>
        <div class="data-item">
            <span class="data-label">5. National ID (NID):</span>
            <span class="data-value">${escapeHtml(member.nationalId)}</span>
        </div>
        <div class="data-item">
            <span class="data-label">6. Occupation:</span>
            <span class="data-value">${escapeHtml(member.occupation)}</span>
        </div>
        <div class="data-item">
            <span class="data-label">7. Education:</span>
            <span class="data-value">${escapeHtml(member.education)}</span>
        </div>
        <div class="data-item">
            <span class="data-label">8. Blood Group:</span>
            <span class="data-value">${escapeHtml(member.bloodGroup)}</span>
        </div>
        <div class="data-item">
            <span class="data-label">9. Marital Status:</span>
            <span class="data-value">${escapeHtml(member.maritalStatus)}</span>
        </div>
        <div class="data-item">
            <span class="data-label">10. Mobile Number:</span>
            <span class="data-value">${escapeHtml(member.mobile)}</span>
        </div>
        <div class="data-item">
            <span class="data-label">11. Email:</span>
            <span class="data-value">${escapeHtml(member.email)}</span>
        </div>
        <div class="data-item full">
            <span class="data-label">12. Present Address:</span>
            <span class="data-value">${escapeHtml(member.presentAddress)}</span>
        </div>
        <div class="data-item full">
            <span class="data-label">13. Permanent Address:</span>
            <span class="data-value">${escapeHtml(member.permanentAddress)}</span>
        </div>
    </div>

    <div class="section-title">Emergency Contact</div>
    <div class="data-grid">
        <div class="data-item">
            <span class="data-label">14. Contact Name:</span>
            <span class="data-value">${escapeHtml(member.emergencyContactName)}</span>
        </div>
        <div class="data-item">
            <span class="data-label">15. Relationship:</span>
            <span class="data-value">${escapeHtml(member.emergencyContactRelation)}</span>
        </div>
        <div class="data-item">
            <span class="data-label">16. Contact Mobile:</span>
            <span class="data-value">${escapeHtml(member.emergencyContactMobile)}</span>
        </div>
    </div>

    <div class="section-title">Reference</div>
    <div class="data-grid">
        <div class="data-item">
            <span class="data-label">17. Name:</span>
            <span class="data-value">${escapeHtml(reference.name)}</span>
        </div>
        <div class="data-item">
            <span class="data-label">18. Relationship:</span>
            <span class="data-value">${escapeHtml(reference.relation)}</span>
        </div>
        <div class="data-item">
            <span class="data-label">19. Mobile Number:</span>
            <span class="data-value">${escapeHtml(reference.mobile)}</span>
        </div>
    </div>

    <div class="section-title">Declaration</div>
    <div class="declaration-box">
        <p class="declaration-text">
            I hereby declare that I will abide by all objectives, rules, and regulations of the Foundation, and will actively participate in all social welfare activities with integrity and dedication.
        </p>
    </div>

    <div class="section-title">Membership Information</div>
    <div class="data-grid">
        <div class="data-item">
            <span class="data-label">20. Member ID:</span>
            <span class="data-value">${escapeHtml(member.memberId)}</span>
        </div>
        <div class="data-item">
            <span class="data-label">21. Group:</span>
            <span class="data-value">${escapeHtml(member.group?.name)}</span>
        </div>
        <div class="data-item">
            <span class="data-label">22. Group Code:</span>
            <span class="data-value">${escapeHtml(member.group?.code)}</span>
        </div>
        <div class="data-item">
            <span class="data-label">23. Joining Date:</span>
            <span class="data-value">${escapeHtml(formatDateEnglish(member.joinDate))}</span>
        </div>
        <div class="data-item">
            <span class="data-label">24. Position:</span>
            <span class="data-value">${escapeHtml(positionLabel)}</span>
        </div>
        <div class="data-item">
            <span class="data-label">25. Status:</span>
            <span class="data-value">${escapeHtml(translateStatus(member.status))}</span>
        </div>
    </div>

    <div class="footer">
        This is a computer-generated member profile and registration form.
    </div>

</div>

</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
