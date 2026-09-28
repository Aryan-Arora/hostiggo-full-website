export default function CopyrightBar() {
  return (
    <div className="w-full bg-[#004772] py-6 px-4">
      <p className="text-white text-sm text-center font-medium">
        © {new Date().getFullYear()} Hostiggo Trips Private Limited. Travel made simple.
      </p>
    </div>
  );
}
