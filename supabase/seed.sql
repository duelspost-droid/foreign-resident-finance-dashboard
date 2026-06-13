INSERT INTO foreign_resident_region_month
  (base_month, sido, sigungu, nationality, gender, resident_count, long_term_count, short_term_count, yoy_change_rate, mom_change_rate, source_name)
VALUES
  ('2025-12-01', '서울특별시', '구로구', '중국', '전체', 28500, 26000, 2500, 3.2, 0.4, '법무부 등록외국인 체류현황 샘플'),
  ('2025-12-01', '경기도', '안산시', '우즈베키스탄', '전체', 14200, 13200, 1000, 7.8, 1.1, '법무부 등록외국인 체류현황 샘플'),
  ('2025-12-01', '충청남도', '아산시', '베트남', '전체', 9800, 9100, 700, 9.4, 1.6, '법무부 등록외국인 체류현황 샘플');

INSERT INTO foreign_resident_status
  (base_year, nationality, visa_code, visa_name, segment_type, resident_count, financial_need_tags, source_name)
VALUES
  (2025, '중국', 'F-4', '재외동포', '재외동포', 184000, ARRAY['장기거주 금융', '신용카드', '주거금융'], '법무부 체류자격별 현황 샘플'),
  (2025, '베트남', 'E-9', '비전문취업', '비전문취업 근로자', 93500, ARRAY['급여계좌', '본국송금', '다국어 상담'], '법무부 체류자격별 현황 샘플'),
  (2025, '몽골', 'D-2', '유학', '유학생', 21400, ARRAY['계좌개설', '체크카드', '등록금 납부'], '법무부 체류자격별 현황 샘플');

INSERT INTO foreign_student_university
  (base_year, university_name, campus_name, university_type, sido, sigungu, address, nationality, degree_course, student_count, source_name)
VALUES
  (2025, '한국외국어대학교', '서울캠퍼스', '사립', '서울특별시', '동대문구', '서울특별시 동대문구 이문로', '몽골', '학위과정', 520, '교육부 유학생 현황 샘플'),
  (2025, '성균관대학교', '서울캠퍼스', '사립', '서울특별시', '종로구', '서울특별시 종로구 성균관로', '중국', '학위과정', 1100, '교육부 유학생 현황 샘플'),
  (2025, '부산대학교', '부산캠퍼스', '국립', '부산광역시', '금정구', '부산광역시 금정구 부산대학로', '베트남', '학위과정', 430, '교육부 유학생 현황 샘플');
