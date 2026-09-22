import 'package:flutter/material.dart';

class ProofPreview extends StatelessWidget {
  const ProofPreview({super.key, required this.path});
  final String path;

  @override
  Widget build(BuildContext context) => Container(
    height: 155,
    width: double.infinity,
    color: const Color(0xFFEAF0FF),
    alignment: Alignment.center,
    child: const Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          Icons.photo_camera_back_outlined,
          color: Color(0xFF2457D6),
          size: 36,
        ),
        SizedBox(height: 8),
        Text(
          'Comprovante registrado no navegador',
          style: TextStyle(
            color: Color(0xFF2457D6),
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    ),
  );
}
