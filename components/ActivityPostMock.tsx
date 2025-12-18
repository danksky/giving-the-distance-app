import Image from "next/image";

interface ActivityPostMockProps {
  businessName?: string;
  businessLocation?: string;
  athleteName?: string;
  activityType?: string;
  distance?: string;
  charityName?: string;
  donationAmount?: string;
}

export default function ActivityPostMock({
  businessName = "Your Business Name",
  businessLocation = "Brooklyn, NY",
  athleteName = "Jordan Runsfast",
  activityType = "Evening Walk",
  distance = "0.04 mi",
  charityName = "ASPCA",
  donationAmount = "$2.50",
}: ActivityPostMockProps) {
  return (
    <div className="bg-white rounded-lg border border-[#e5e7eb] overflow-hidden max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[#e5e7eb]">
        <div className="w-10 h-10 rounded-full overflow-hidden">
          <Image
            src="/fake-people/fake-person-1.png"
            alt={athleteName}
            width={40}
            height={40}
            className="object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-[15px]">{athleteName}</div>
          <div className="text-[13px] text-[#6b7280]">
            Yesterday at 7:06 PM • Garmin Forerunner 965
          </div>
          <div className="text-[13px] text-[#6b7280] flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                clipRule="evenodd"
              />
            </svg>
            Brooklyn, NY
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-3">{activityType}</h2>
        <p className="text-[15px] text-[#171717] mb-4">
          {athleteName.split(" ")[0]}&apos;s walk inspired {businessName} to
          donate to {athleteName.split(" ")[0]}&apos;s chosen charity,{" "}
          {charityName} -{" "}
          <span className="text-[#B56DFF] font-medium">
            givingthedistance.org
          </span>{" "}
          #GTD
        </p>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-4">
          <div>
            <div className="text-[13px] text-[#6b7280] mb-1">Distance</div>
            <div className="text-2xl font-bold">10.2 mi</div>
          </div>
          <div>
            <div className="text-[13px] text-[#6b7280] mb-1">Pace</div>
            <div className="text-2xl font-bold">7:58 /mi</div>
          </div>
          <div>
            <div className="text-[13px] text-[#6b7280] mb-1">Time</div>
            <div className="text-2xl font-bold">1h 23m</div>
          </div>
        </div>
        {/* Map */}
        <div className="relative w-full h-48 rounded-lg mb-4 overflow-hidden">
          <Image
            src="/mock-map.png"
            alt="Activity route map"
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-[#e5e7eb]">
        {/* Kudos */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <Image
                src="/fake-people/fake-person-2.png"
                alt="User"
                width={24}
                height={24}
                className="rounded-full object-cover border-2 border-white"
              />
              <Image
                src="/fake-people/fake-person-4.png"
                alt="User"
                width={24}
                height={24}
                className="rounded-full object-cover border-2 border-white"
              />
              <Image
                src="/fake-people/fake-person-1.png"
                alt="User"
                width={24}
                height={24}
                className="rounded-full object-cover border-2 border-white"
              />
            </div>
            <span className="text-xs text-[#6b7280]">23 gave kudos</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-around">
          <button className="flex items-center gap-2 text-[#6b7280] hover:text-[#171717] transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z"
              />
            </svg>
          </button>
          <button className="flex items-center gap-2 text-[#6b7280] hover:text-[#171717] transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
              />
            </svg>
          </button>
          <button className="flex items-center gap-2 text-[#6b7280] hover:text-[#171717] transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
