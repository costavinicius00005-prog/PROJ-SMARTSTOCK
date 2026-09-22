import 'dart:io';

import 'package:flutter/material.dart';

class ProofPreview extends StatelessWidget {
  const ProofPreview({super.key, required this.path});
  final String path;

  @override
  Widget build(BuildContext context) => Image.file(
    File(path),
    height: 155,
    width: double.infinity,
    fit: BoxFit.cover,
  );
}
